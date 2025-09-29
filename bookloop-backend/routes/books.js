const express = require("express");
const router = express.Router();
const Book = require("../models/Book");

// GET all books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find()
      .populate("seller", "username email bio"); // populate seller info
    res.json(books); // send array directly
  } catch (err) {
    console.error("Failed to fetch books:", err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// ✅ GET books by current user (my listings)
router.get("/my", async (req, res) => {
  try {
    const userId = req.query.userId; // pass ?userId=xxx
    if (!userId) {
      return res.status(400).json({ error: "userId query param is required" });
    }

    const books = await Book.find({ seller: userId })
      .populate("seller", "username email bio") // populate seller info
      .exec();

    res.json(books);
  } catch (err) {
    console.error("Failed to fetch user books:", err);
    res.status(500).json({ error: "Failed to fetch user books" });
  }
});

// POST new book
router.post("/", async (req, res) => {
  try {
    console.log("📩 Incoming book payload:", req.body);
    const { title, author, genre, condition, price, location, description, seller } = req.body;

    if (!title || !author || !seller) {
      return res.status(400).json({ error: "Title, author, and seller are required" });
    }

    const book = new Book({
      title,
      author,
      genre,
      condition,
      price,
      location,
      description,
      seller // sellerId from frontend
    });

    const savedBook = await book.save();
    // Populate seller info
await savedBook.populate("seller", "username email bio").execPopulate();

res.status(201).json(savedBook);
    console.log("✅ Book saved:", savedBook);
    res.status(201).json(savedBook);
  } catch (err) {
    console.error("Book save error:", err);
    res.status(500).json({ error: "Failed to list book" });
  }
});

// DELETE a book
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    console.log("🛠️ Delete attempt:", { id, userId });

    if (!userId) {
      return res.status(400).json({ error: "userId query param is required" });
    }

    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    if (!book.seller) return res.status(400).json({ error: "Book missing seller info" });

    if (book.seller.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this listing" });
    }

    await book.deleteOne(); // ✅ correct for Mongoose 6+
    console.log("✅ Book deleted:", id);

    res.json({ message: "Listing deleted successfully 🗑️" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

module.exports = router;
