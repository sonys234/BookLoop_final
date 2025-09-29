const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const auth = require('../middleware/auth');

// POST /api/messages/:conversationId - Send message
router.post('/:conversationId', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const senderId = req.user.id;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message cannot be empty'
      });
    }

    // Check if conversation exists and is accepted
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    if (conversation.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'This conversation is not accepted yet'
      });
    }

    // Check if user is part of this conversation
    if (![conversation.buyerId.toString(), conversation.sellerId.toString()].includes(senderId)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to send messages in this conversation'
      });
    }

    const newMessage = new Message({
      conversationId: req.params.conversationId,
      senderId,
      message: message.trim()
    });

    await newMessage.save();

    // Update conversation's last message and timestamp
    conversation.lastMessage = message.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate sender info for response
    await newMessage.populate('senderId', 'username firstName lastName');

    res.json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// GET /api/messages/:conversationId - Get messages for conversation
router.get('/:conversationId', auth, async (req, res) => {
  try {
    // Check if user is part of this conversation
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    if (![conversation.buyerId.toString(), conversation.sellerId.toString()].includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view these messages'
      });
    }

    const messages = await Message.find({
      conversationId: req.params.conversationId
    })
    .populate('senderId', 'username firstName lastName')
    .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;





