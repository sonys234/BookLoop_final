// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

const User = require("../models/User");

// =======================
// REGISTER
// =======================
router.post("/register", async (req, res) => {
  console.log("📩 Register request body:", req.body);

  const { username, firstName, lastName, email, password, phone, location } = req.body;
  try {
    // check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      location,
    });

    await newUser.save();

    res.json({ msg: "User registered!" });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// UPDATE PROFILE
// =======================
router.put("/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, firstName, lastName, email, phone, location, bio } = req.body;

    console.log("📝 Update profile request for user:", id);
    console.log("📝 Update data:", req.body);

    // Validate required fields
    if (!username || !email) {
      return res.status(400).json({ error: "Username and email are required" });
    }

    // Check if email is already used by another user
    const existingEmail = await User.findOne({ 
      email, 
      _id: { $ne: id } 
    });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already in use by another account" });
    }

    // Check if username is already used by another user
    const existingUsername = await User.findOne({ 
      username, 
      _id: { $ne: id } 
    });
    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use by another account" });
    }

    // Prepare update object
    const updates = {
      username,
      firstName,
      lastName,
      email,
      phone,
      location,
      bio,
      updatedAt: new Date()
    };

    // Remove undefined fields
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      id, 
      updates, 
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("✅ Profile updated successfully:", user.username);
    
    res.json({ 
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
      }
    });

  } catch (err) {
    console.error("Update profile error:", err.message);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Validation error: " + err.message });
    }
    
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// =======================
// GET USER PROFILE
// =======================
router.get("/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// =======================
// LOGIN
// =======================
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body; // can be email OR username
  try {
    const user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${identifier}$`, "i") } },
        { username: { $regex: new RegExp(`^${identifier}$`, "i") } },
      ],
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        location: user.location || "",
        bio: user.bio || "",
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;