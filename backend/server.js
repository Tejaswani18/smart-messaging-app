const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// Socket.IO for real-time messaging
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
  });
  socket.on('sendMessage', async ({ groupId, senderId, content }) => {
    try {
      const user = await User.findById(senderId);
      const isHighlighted = user.preferences.some((pref) => content.toLowerCase().includes(pref.toLowerCase()));
      const message = new Message({ groupId, senderId, content, isHighlighted });
      await message.save();
      const populatedMessage = await Message.findById(message._id).populate('senderId', 'username');
      io.to(groupId).emit('receiveMessage', populatedMessage);

      // Auto-answer logic
      const autoResponses = {
        'hello': 'Hi! Welcome to the group!',
        'help': 'How can I assist you today?',
      };
      const contentLower = content.toLowerCase();
      for (const [trigger, response] of Object.entries(autoResponses)) {
        if (contentLower.includes(trigger)) {
          const autoMessage = new Message({
            groupId,
            senderId: null, // Bot message
            content: response,
            isHighlighted: false,
          });
          await autoMessage.save();
          io.to(groupId).emit('receiveMessage', { ...autoMessage.toObject(), senderId: { username: 'Bot' } });
          break;
        }
      }
    } catch (error) {
      console.error(error);
    }
  });
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
const userRoutes = require('./routes/user');
const groupRoutes = require('./routes/group');
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));