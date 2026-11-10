const express = require('express');
const dns = require('dns');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Use public DNS servers so Node's c-ares resolver can resolve MongoDB +srv records
// when the local router/OS DNS stub refuses SRV queries (ECONNREFUSED)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const bodyParser = require('body-parser');
// const session = require('express-session');
// const MongoStore = require('connect-mongo');
// const cookieParser = require('cookie-parser');
const authRoutes = require('./Routes/auth');
const blogRoutes = require('./Routes/blogs');
const { refreshBlogsCache, startScheduledBlogsCron } = require('./controllers/blogController');
const userRoutes = require('./Routes/users');
const notificationRoutes = require('./Routes/notifications');
const messageRoutes = require('./Routes/messages');
const channelRoutes = require('./Routes/channels');
const subscribeRoutes = require('./Routes/subscribe');
const adminRoutes = require('./Routes/admin');
const cors = require('cors');
const corsOptions = { origin: "*", credentials: true, optionSuccessStatus: 200 };

const http = require('http');
const app = express();
const server = http.createServer(app);

dotenv.config();
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: ["https://blog-sum.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  }
});

app.use(express.json());
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(cookieParser());

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

  socket.on('getOnlineUsers', () => {
    socket.emit('onlineUsers', Array.from(onlineUsersMap.keys()));
  });

  socket.on('joinChannel', (channelId) => {
    if (channelId) {
      socket.join(channelId.toString());
    }
  });

  socket.on('disconnect', () => {
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
  })
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/subscribe', subscribeRoutes);
app.use('/api/admin', adminRoutes);

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
