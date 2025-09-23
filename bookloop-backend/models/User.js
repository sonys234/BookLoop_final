
// module.exports = mongoose.model('User', UserSchema);
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastLogin: { type: Date },
  firstName: { type: String, default: "" },
  lastName:  { type: String, default: "" },
  phone:     { type: String, default: "" },
  location:  { type: String, default: "" },
  bio:       { type: String, default: "" },
});

module.exports = mongoose.model('User', userSchema);