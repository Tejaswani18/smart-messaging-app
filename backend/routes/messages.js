const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { groupId, content } = req.body;
  try {
    const user = await User.findById(req.userId);
    const isHighlighted = user.preferences.some(pref => content.toLowerCase().includes(pref.toLowerCase()));
    const message = new Message({ groupId, senderId: req.userId, content, isHighlighted });
    await message.save();
    
    // Auto-answering logic (simple FAQ example)
    let autoResponse = null;
    if (content.toLowerCase().includes('hello')) {
      autoResponse = new Message({
        groupId,
        senderId: req.userId,
        content: 'Hi! Welcome to the group!',
        isHighlighted: false,
      });
      await autoResponse.save();
    }
    
    res.status(201).json({ message, autoResponse });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:groupId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ groupId: req.params.groupId }).populate('senderId', 'username');
    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;