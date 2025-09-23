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
// UPDATE PROFILE
router.put("/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updates = (({ username, firstName, lastName, email, phone, location, bio }) => ({
      username,
      firstName,
      lastName,
      email,
      phone,
      location,
      bio,
    }))(req.body);

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user }); // 🔥 make it consistent with login
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ error: "Failed to update profile" });
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