const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
// const session = require('express-session');
// const MongoStore = require('connect-mongo');
// const cookieParser = require('cookie-parser');
const authRoutes = require('./Routes/auth');
const blogRoutes = require('./Routes/blogs');
const userRoutes = require('./Routes/users');
const notificationRoutes = require('./Routes/notifications');
const messageRoutes = require('./Routes/messages');
const subscribeRoutes = require('./Routes/subscribe')
const cors = require('cors');
const corsOptions = { origin: "*", credentials: true, optionSuccessStatus: 200 };


// const http = require('http');
const app = express();
// const server = http.createServer(app);

dotenv.config();
// const io = require("socket.io")(server, {
//   cors: {
//     origin:"*",
//     methods: ["GET", "POST"],
//     allowedHeaders: ["my-custom-header"],
//     credentials: true,
//   }
// });

app.use(express.json());
app.use(cors(corsOptions));
app.use(bodyParser.json());
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

// Socket.IO connection handling
// io.on('connection', (socket) => {
//   console.log('New client connected');

//   // Join a room based on user ID
//   socket.on('join', (_id) => {
//     socket.join(_id.toString());
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//   });
// });

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected');
    // // Attach io instance to app for use in routes
    // app.io = io;
  })
  .catch(err => console.error(err));

app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/subscribe', subscribeRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    team_name: "Mesho Devs", dev_team: ["Mesho", "Mesho254"].sort()
  });
});

app.use("*", (req, res) => {
  res.status(500).json({ status: "error", message: "This route does not exist" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`You can Test the API here ${"http://localhost:5000/api-docs/"}`);
});