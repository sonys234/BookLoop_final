const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  title: String,
  author: String,
  genre: String,
  condition: String,
  price: Number,
  location: String,
  description: String,
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  dateAdded: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Book", BookSchema);