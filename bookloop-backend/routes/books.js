const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const multer = require("multer");

// Multer setup for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Only images allowed!"), false);
  },
});

// Helper to convert image buffers to base64
function convertImages(books) {
  return books.map(book => {
    const obj = book.toObject();
    if (obj.images && obj.images.length > 0) {
      obj.images = obj.images.map(img => ({
        ...img,
        data: img.data.toString("base64"),
        url: `data:${img.contentType};base64,${img.data.toString("base64")}`,
      }));
    }
    return obj;
  });
}

// GET all books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find()
      .populate("seller", "username firstName lastName email bio phone location")
      .sort({ dateAdded: -1 });
    res.json(convertImages(books));
  } catch (err) {
    console.error("❌ Error fetching books:", err);
    res.status(500).json({ error: "Failed to fetch books: " + err.message });
  }
});

// GET books by user
router.get("/my", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId query param required" });

    const books = await Book.find({ seller: userId })
      .populate("seller", "username firstName lastName email bio phone location")
      .sort({ dateAdded: -1 })
      .exec();

    res.json(convertImages(books));
  } catch (err) {
    console.error("❌ Error fetching user books:", err);
    res.status(500).json({ error: "Failed to fetch user books: " + err.message });
  }
});

// POST new book
router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    console.log("📩 Incoming book payload:", req.body);
    console.log("📸 Files received:", req.files?.length || 0);

    const { title, author, genre, condition, price, description, seller, location } = req.body;
    if (!title || !author || !seller) {
      return res.status(400).json({ error: "Title, author, and seller are required" });
    }

    let locationData = {};
    if (location) {
      try {
        locationData = typeof location === "string" ? JSON.parse(location) : location;
      } catch {
        locationData = { area: "", city: "", state: "", country: "" };
      }
    }

    // Validate required location fields
    if (!locationData.area || !locationData.city || !locationData.country) {
      return res.status(400).json({ error: "Area, city, and country are required" });
    }

    // Process images
    const images = req.files?.map(file => ({
      data: file.buffer,
      contentType: file.mimetype,
      filename: file.originalname,
      size: file.size,
    })) || [];

    const book = new Book({
      title,
      author,
      genre,
      condition,
      price,
      description,
      seller,
      location: {
        area: locationData.area.trim(),
        city: locationData.city.trim(),
        state: (locationData.state || "").trim(),
        country: locationData.country.trim(),
      },
      images,
    });

    const savedBook = await book.save();

    // Populate seller and convert images
    const populatedBook = await Book.findById(savedBook._id)
      .populate("seller", "username firstName lastName email bio phone location");

    res.status(201).json(convertImages([populatedBook])[0]);
  } catch (err) {
    console.error("❌ Book save error:", err);
    res.status(500).json({ error: "Failed to list book: " + err.message });
  }
});

// PUT update book
// PUT update book - SIMPLIFIED VERSION
router.put("/:id", upload.array("images", 5), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, genre, condition, price, description } = req.body;

        console.log("📝 Update request for book:", id);
        console.log("📦 Received data:", {
            title, author, genre, condition, price, description,
            deleteImages: req.body.deleteImages,
            filesCount: req.files?.length || 0
        });

        // Basic validation
        if (!title || !author || !genre || !condition || !price) {
            return res.status(400).json({ error: "All required fields must be filled" });
        }

        // Parse location
        let locationData = {};
        if (req.body.location) {
            try {
                locationData = JSON.parse(req.body.location);
            } catch (err) {
                return res.status(400).json({ error: "Invalid location format" });
            }
        }

        // Validate location
        if (!locationData.area || !locationData.city || !locationData.country) {
            return res.status(400).json({ error: "Area, city, and country are required" });
        }

        // Find existing book
        const existingBook = await Book.findById(id);
        if (!existingBook) {
            return res.status(404).json({ error: "Book not found" });
        }

        // Start with existing images
        let finalImages = [...existingBook.images];
        
        // Handle image deletions
        if (req.body.deleteImages) {
            let imagesToDelete = [];
            
            // Handle both array and single string
            if (Array.isArray(req.body.deleteImages)) {
                imagesToDelete = req.body.deleteImages;
            } else {
                imagesToDelete = [req.body.deleteImages];
            }
            
            console.log("🗑️ Deleting images:", imagesToDelete);
            finalImages = finalImages.filter(img => !imagesToDelete.includes(img._id.toString()));
        }

        // Handle new image uploads
        if (req.files && req.files.length > 0) {
            console.log("📸 Adding new images:", req.files.length);
            const newImages = req.files.map(file => ({
                data: file.buffer,
                contentType: file.mimetype,
                filename: file.originalname,
                size: file.size,
            }));
            finalImages = [...finalImages, ...newImages];
        }

        // Limit to 5 images total
        if (finalImages.length > 5) {
            finalImages = finalImages.slice(0, 5);
        }

        console.log("🖼️ Final images count:", finalImages.length);

        // Update the book
        const updatedBook = await Book.findByIdAndUpdate(
            id,
            {
                title, 
                author, 
                genre, 
                condition, 
                price,
                description: description || "",
                location: {
                    area: locationData.area,
                    city: locationData.city,
                    state: locationData.state || "",
                    country: locationData.country,
                },
                images: finalImages,
            },
            { new: true, runValidators: true }
        ).populate("seller", "username firstName lastName email bio phone location");

        if (!updatedBook) {
            return res.status(404).json({ error: "Book not found after update" });
        }

        // Convert images for response
        const responseBook = convertImages([updatedBook])[0];
        res.json(responseBook);

    } catch (err) {
        console.error("❌ Update error:", err);
        res.status(500).json({ error: "Failed to update book: " + err.message });
    }
});

// DELETE a book
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId query param required" });

    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ error: "Book not found" });
    if (!book.seller) return res.status(400).json({ error: "Book missing seller info" });
    if (book.seller.toString() !== userId) return res.status(403).json({ error: "Not authorized" });

    await book.deleteOne();
    res.json({ message: "Listing deleted successfully 🗑️" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: "Failed to delete listing: " + err.message });
  }
});

module.exports = router;
