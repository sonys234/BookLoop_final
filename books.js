// // routes/books.js
// const express = require('express');
// const router = express.Router();

// // test route
// router.get('/', (req, res) => {
//   res.json({ msg: 'Books route works!' });
// });

// module.exports = router;

const express = require('express');
const router = express.Router();

// GET all books
router.get('/', (req, res) => {
  res.json({ message: "All books route works 🚀" });
});

module.exports = router;
