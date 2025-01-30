require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const cron = require("node-cron");
const TelegramBot = require("node-telegram-bot-api");

// Chargement des variables globales
const API_URL = process.env.API_URL;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MONGO_URI = process.env.MONGO_URI;
const DATA_TTL = parseInt(process.env.DATA_TTL, 10) || 86400;
const API_FETCH_INTERVAL = parseFloat(process.env.API_FETCH_INTERVAL) || 0.5;
const ALERT_DUPLICATE_COUNT = parseInt(process.env.ALERT_DUPLICATE_COUNT, 10) || 2;

// Connexion à MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connecté à MongoDB"))
    .catch(err => console.error("❌ Erreur MongoDB :", err));

// Schéma MongoDB
const coinSchema = new mongoose.Schema({
    mint: String,
    name: String,
    symbol: String,
    twitter: String,
    telegram: String,
    createdAt: { type: Date, default: Date.now, expires: DATA_TTL } // Suppression automatique
});

const Coin = mongoose.model("Coin", coinSchema);

// Initialisation du bot Telegram
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// Fonction pour envoyer une alerte Telegram
const sendTelegramAlert = async (message) => {
    await bot.sendMessage(TELEGRAM_CHAT_ID, `🚨 ALERTE : ${message}`);
};

// Fonction principale pour récupérer et stocker les données
const fetchData = async () => {
    try {
        const response = await axios.get(API_URL);
        const data = response.data;

        if (!data) return;

        const { mint, name, symbol, twitter, telegram } = data;

        // Vérifier si Twitter ou Telegram a été répété ALERT_DUPLICATE_COUNT fois
        if (twitter || telegram) {
            const duplicateCount = await Coin.countDocuments({
                $or: [{ twitter }, { telegram }]
            });

            if (duplicateCount >= ALERT_DUPLICATE_COUNT) {
                sendTelegramAlert(`⚠️ ${name} (${symbol}) a été détecté ${duplicateCount} fois avec le même Twitter/Telegram.`);
            }
        }

        // Enregistrer dans MongoDB
        const newCoin = new Coin({ mint, name, symbol, twitter, telegram });
        await newCoin.save();

        console.log(`✅ Enregistré : ${name} (${symbol})`);

    } catch (error) {
        console.error("❌ Erreur API :", error.message);
    }
};

// Exécuter selon la fréquence définie en variables d'environnement
cron.schedule(`*/${API_FETCH_INTERVAL * 60} * * * * *`, fetchData);

console.log(`🚀 Bot en cours d'exécution... Requête toutes les ${API_FETCH_INTERVAL}s`);
