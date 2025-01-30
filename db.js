const mongoose = require("mongoose");

const DB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pump_fun";

mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("✅ Connexion MongoDB réussie"))
    .catch(err => console.error("❌ Erreur de connexion MongoDB :", err));

module.exports = mongoose;
