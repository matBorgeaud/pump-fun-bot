const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    chatId: { type: String, unique: true, required: true },
    username: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
