const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');

// Create conversation
router.post('/conversations', async (req, res) => {
  const { userId, sellerId, bookId } = req.body;
  const convo = new Conversation({ participants: [userId, sellerId], book: bookId });
  await convo.save();
  res.json(convo);
});

// Send message
router.post('/messages/:conversationId', async (req, res) => {
  const convo = await Conversation.findById(req.params.conversationId);
  convo.messages.push({ sender: req.body.senderId, text: req.body.text });
  await convo.save();
  res.json(convo);
});

// Get conversation
router.get('/messages/:conversationId', async (req, res) => {
  const convo = await Conversation.findById(req.params.conversationId).populate('participants').populate('book');
  res.json(convo);
});

module.exports = router;

