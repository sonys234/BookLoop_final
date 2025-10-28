const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  title: String,
  author: String,
  genre: {
    type: String,
    enum: ["fiction", "non-fiction", "science", "history", "romance", "mystery", "fantasy", "biography", "academic", "children", "self-help"]
  },
  condition: String,
  price: Number,
  location: {
    area: String,
    city: String,
    state: String,
    country: String
  },
  description: String,
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  dateAdded: { type: Date, default: Date.now },
  images: [{
    data: Buffer,
    contentType: String,
    filename: String,
    size: Number
  }]
}, { timestamps: true });

module.exports = mongoose.model("Book", BookSchema);