const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    chatId: { type: String, unique: true, required: true },
    username: { type: String },
    createdAt: { type: Date, default: Date.now },
    ignoredAccounts: { type: [String], default: [] },
    telegramThreshold: { type: Number, default: 1 },
    twitterThreshold: { type: Number, default: 1 }
});

module.exports = mongoose.model("User", userSchema);