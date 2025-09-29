const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Book = require('../models/Book');
const auth = require('../middleware/auth');

// POST /api/conversations - Create new conversation (show interest)
router.post('/', auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    const buyerId = req.user.id;

    // Validate book exists
    const book = await Book.findById(bookId).populate('seller', 'username firstName lastName');
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    // Check if user is trying to show interest in their own book
    if (book.seller._id.toString() === buyerId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot show interest in your own book'
      });
    }

    // Check if conversation already exists
    const existingConv = await Conversation.findOne({
      bookId,
      buyerId
    });

    if (existingConv) {
      return res.status(400).json({
        success: false,
        error: 'You have already shown interest in this book'
      });
    }

    // Create new conversation
    const conversation = new Conversation({
      bookId,
      buyerId,
      sellerId: book.seller._id,
      status: 'pending'
    });

    await conversation.save();

    // Populate the conversation for response
    const populatedConv = await Conversation.findById(conversation._id)
      .populate('buyerId', 'username firstName lastName')
      .populate('sellerId', 'username firstName lastName')
      .populate('bookId', 'title author price condition');

    res.status(201).json({
      success: true,
      message: 'Interest shown successfully! Waiting for seller approval.',
      conversation: populatedConv
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// GET /api/conversations/pending/:userId - Get pending requests for seller
router.get('/pending/:userId', auth, async (req, res) => {
  try {
    const pending = await Conversation.find({
      sellerId: req.params.userId,
      status: 'pending'
    })
    .populate('buyerId', 'username firstName lastName email')
    .populate('bookId', 'title author price condition')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      pending
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// GET /api/conversations/:userId - Get user's conversations (accepted ones)
router.get('/:userId', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      $or: [
        { buyerId: req.params.userId },
        { sellerId: req.params.userId }
      ],
      status: 'accepted'
    })
    .populate('buyerId', 'username firstName lastName')
    .populate('sellerId', 'username firstName lastName')
    .populate('bookId', 'title author price')
    .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// PUT /api/conversations/:conversationId/approve - Approve/reject request
router.put('/:conversationId/approve', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be either "accepted" or "rejected"'
      });
    }

    const conversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      { 
        status,
        lastMessageAt: new Date()
      },
      { new: true }
    )
    .populate('buyerId', 'username firstName lastName')
    .populate('sellerId', 'username firstName lastName')
    .populate('bookId', 'title author price');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      conversation
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;


