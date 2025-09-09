const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const bookRoutes = require("./routes/books");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("🟢 MongoDB connected"))
.catch((err) => console.log("❌ Mongo Error: ", err));

// routes
app.use('/api/auth', authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/auth", require("./routes/auth"));

//app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

