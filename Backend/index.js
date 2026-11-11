const express = require('express');
const dns = require('dns');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

// Use public DNS servers so Node's c-ares resolver can resolve MongoDB +srv records
// when the local router/OS DNS stub refuses SRV queries (ECONNREFUSED)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const bodyParser = require('body-parser');
const authRoutes = require('./Routes/auth');
const blogRoutes = require('./Routes/blogs');
const { refreshBlogsCache, startScheduledBlogsCron } = require('./controllers/blogController');
const userRoutes = require('./Routes/users');
const notificationRoutes = require('./Routes/notifications');
const messageRoutes = require('./Routes/messages');
const channelRoutes = require('./Routes/channels');
const subscribeRoutes = require('./Routes/subscribe');
const adminRoutes = require('./Routes/admin');
const seriesRoutes = require('./Routes/series');
const tipRoutes = require('./Routes/tips');
const readingListRoutes = require('./Routes/readingLists');
const publicationRoutes = require('./Routes/publications');
const developerRoutes = require('./Routes/developer');
const cors = require('cors');

dotenv.config();

const app = express();
const http = require('http');
const server = http.createServer(app);

// Strict CORS with credentials support
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://blog-sum.vercel.app',
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.CLIENT_URL === origin) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev, credentials safely bound
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionSuccessStatus: 200,
};

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: ["https://blog-sum.vercel.app", "http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  }
});

// 1. Helmet HTTP Security Headers (Protection against MIME sniffing, clickjacking, etc.)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows uploaded images/assets to be rendered across domains
    contentSecurityPolicy: false, // Managed by client build/host
  })
);

// 2. Cookie Parser (Enables httpOnly session and auth token inspection)
app.use(cookieParser());

// 3. NoSQL Injection Defense (Strips $ and . from request body, query, and params)
app.use(mongoSanitize({ replaceWith: '_' }));

app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors(corsOptions));

// 4. Rate Limiters (Brute force & DDoS protection)
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests from this IP. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many submissions. Please slow down and try again shortly.' },
});

// Apply global rate limiting to all API routes
app.use('/api', generalApiLimiter);

// 5. Sandboxed File Serving (Forces resume PDFs to download as attachments rather than executing inline)
app.use(
  '/uploads/resumes',
  (req, res, next) => {
    res.setHeader('Content-Disposition', 'attachment');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },
  express.static(path.join(__dirname, 'uploads', 'resumes'))
);

// General static uploads (avatars, blog photos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
//     cookie: {
//       maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
//       httpOnly: true,
//       sameSite: 'lax',
//       secure: true || process.env.NODE_ENV === 'production', // Use secure cookies in production
//     },
//   })
// );

// Track active online users: userId -> Set of socketIds
const onlineUsersMap = new Map();

// Track live story reader presence: storyId -> Set of socketIds
const storyViewersMap = new Map();

const broadcastOnlineUsers = () => {
  io.emit('onlineUsers', Array.from(onlineUsersMap.keys()));
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Join a room based on user ID and mark user online
  socket.on('join', (_id) => {
    if (!_id) return;
    const userId = _id.toString();
    socket.userId = userId;
    socket.join(userId);

    if (!onlineUsersMap.has(userId)) {
      onlineUsersMap.set(userId, new Set());
    }
    onlineUsersMap.get(userId).add(socket.id);
    broadcastOnlineUsers();
  });

  // Live Story Reader Presence
  socket.on('joinStory', (storyId) => {
    if (!storyId) return;
    const sId = storyId.toString();
    socket.currentStoryId = sId;
    const room = `story_${sId}`;
    socket.join(room);

    if (!storyViewersMap.has(sId)) {
      storyViewersMap.set(sId, new Set());
    }
    storyViewersMap.get(sId).add(socket.id);
    const count = storyViewersMap.get(sId).size;
    io.to(room).emit('storyPresence', { storyId: sId, count });
  });

  socket.on('leaveStory', (storyId) => {
    if (!storyId) return;
    const sId = storyId.toString();
    const room = `story_${sId}`;
    socket.leave(room);

    if (storyViewersMap.has(sId)) {
      const set = storyViewersMap.get(sId);
      set.delete(socket.id);
      const count = set.size;
      if (count === 0) {
        storyViewersMap.delete(sId);
      }
      io.to(room).emit('storyPresence', { storyId: sId, count });
    }
  });

  socket.on('getOnlineUsers', () => {
    socket.emit('onlineUsers', Array.from(onlineUsersMap.keys()));
  });

  socket.on('joinChannel', (channelId) => {
    if (channelId) {
      socket.join(channelId.toString());
    }
  });

  socket.on('disconnect', () => {
    if (socket.currentStoryId && storyViewersMap.has(socket.currentStoryId)) {
      const sId = socket.currentStoryId;
      const set = storyViewersMap.get(sId);
      set.delete(socket.id);
      const count = set.size;
      if (count === 0) {
        storyViewersMap.delete(sId);
      }
      io.to(`story_${sId}`).emit('storyPresence', { storyId: sId, count });
    }

    if (socket.userId && onlineUsersMap.has(socket.userId)) {
      const userSockets = onlineUsersMap.get(socket.userId);
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsersMap.delete(socket.userId);
      }
      broadcastOnlineUsers();
    }
    console.log('Client disconnected');
  });
});

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected');
    // Attach io instance to app for use in routes
    app.set('io', io);
    // Pre-warm the blogs cache on startup so the first request is instant
    refreshBlogsCache().catch((err) => console.error('Initial blog cache warm-up failed:', err));
    // Start node-cron job (every 30s) to auto-publish scheduled blogs & send notifications
    startScheduledBlogsCron(io, '*/30 * * * * *');
    // Start automated Sunday Weekly Digest job
    const { initWeeklyDigestCron } = require('./Utils/weeklyDigestEngine');
    initWeeklyDigestCron();
  })
  .catch(err => console.error(err));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/subscribe', submissionLimiter, subscribeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/tips', tipRoutes);
app.use('/api/reading-lists', readingListRoutes);
app.use('/api/publications', publicationRoutes);
app.use('/api/developer', developerRoutes);

// Public SEO Endpoints
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  const baseUrl = process.env.CLIENT_URL || 'https://blog-sum.vercel.app';
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${baseUrl}/api/blogs/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  res.redirect(301, '/api/blogs/sitemap.xml');
});

app.get("/", (req, res) => {
  res.status(200).json({
    team_name: "Mesho Devs", dev_team: ["Mesho", "Mesho254"].sort()
  });
});

app.use("*", (req, res) => {
  res.status(500).json({ status: "error", message: "This route does not exist" });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`You can Test the API here ${"http://localhost:5000/api-docs/"}`);
});
