const express = require('express');
const Group = require('../models/Group');
const Message = require('../models/Message');
const router = express.Router();

// Create Group
router.post('/', async (req, res) => {
  const { name, members, createdBy } = req.body;
  try {
    const group = new Group({ name, members, createdBy });
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get User's Groups
router.get('/user/:userId', async (req, res) => {
  try {
    const groups = await Group.find({ members: req.params.userId }).populate('members', 'username');
    res.json(groups);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get Group Messages
router.get('/:groupId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ groupId: req.params.groupId })
      .populate('senderId', 'username')
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;