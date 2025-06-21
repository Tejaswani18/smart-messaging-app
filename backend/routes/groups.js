const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Group = require('../models/Group');
const User = require('../models/User');

router.post('/create', auth, async (req, res) => {
  const { name, memberEmails } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const members = [req.user.id];
    if (memberEmails && Array.isArray(memberEmails) && memberEmails.length > 0) {
      const users = await User.find({ email: { $in: memberEmails } });
      const userIds = users.map(user => user._id.toString());
      userIds.forEach(userId => {
        if (!members.includes(userId)) {
          members.push(userId);
        }
      });
      const foundEmails = users.map(user => user.email);
      const notFoundEmails = memberEmails.filter(email => !foundEmails.includes(email));
      if (notFoundEmails.length > 0) {
        console.log(`Users not found for emails: ${notFoundEmails.join(', ')}`);
      }
    }

    const group = new Group({
      name,
      members,
    });
    await group.save();

    await group.populate('members', 'username email');
    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id }).populate('members', 'username email');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.post('/:groupId/add-members', auth, async (req, res) => {
  const { groupId } = req.params;
  const { memberEmails } = req.body;
  try {
    // Find the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if the user is a member of the group (basic authorization)
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Find users by email
    if (!memberEmails || !Array.isArray(memberEmails) || memberEmails.length === 0) {
      return res.status(400).json({ error: 'Member emails are required' });
    }

    const users = await User.find({ email: { $in: memberEmails } });
    const userIds = users.map(user => user._id.toString());

    // Add new members, avoiding duplicates
    userIds.forEach(userId => {
      if (!group.members.includes(userId)) {
        group.members.push(userId);
      }
    });

    // Log emails that didn't match any user
    const foundEmails = users.map(user => user.email);
    const notFoundEmails = memberEmails.filter(email => !foundEmails.includes(email));
    if (notFoundEmails.length > 0) {
      console.log(`Users not found for emails: ${notFoundEmails.join(', ')}`);
    }

    // Save the updated group
    await group.save();

    // Populate members for the response
    await group.populate('members', 'username email');
    res.status(200).json(group);
  } catch (error) {
    console.error('Error adding members to group:', error);
    res.status(500).json({ error: 'Failed to add members' });
  }
});

router.get('/:groupId', auth, async (req, res) => {
  const { groupId } = req.params;
  try {
    const group = await Group.findById(groupId).populate('members', 'username email');
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    if (!group.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

module.exports = router;