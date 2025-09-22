// models/Conversation.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  messages: [messageSchema]
});

module.exports = mongoose.model('Conversation', conversationSchema);
