const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
    telegram: { type: String, index: true },
    twitter: { type: String, index: true },
    createdAt: { type: Date, default: Date.now, expires: '24h' } // Auto suppression après 24h
});

module.exports = mongoose.model("Alert", alertSchema);
