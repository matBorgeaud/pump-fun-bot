const axios = require("axios");
const Alert = require("../models/Alert");
const { sendTelegramAlertToUsers } = require("./telegramBot");
const User = require("../models/User");
require("dotenv").config();

const API_URL = "https://frontend-api.pump.fun/coins/latest";

const fetchAndStoreData = async () => {
    try {
        const response = await axios.get(API_URL);
        const { telegram, twitter, symbol } = response.data;

        if (!telegram && !twitter) return;

        // Vérifie si une alerte existe déjà
        const query = {};
        if (telegram) query.telegram = telegram;
        if (twitter) query.twitter = twitter;
        
        const existingAlerts = await Alert.find({ $or: [query] });

        // Stocker la nouvelle donnée
        await Alert.create({ telegram, twitter });

        if (existingAlerts.length > 0) {
            const users = await User.find();
            for (const user of users) {
                const telegramThreshold = user.telegramThreshold || 1;
                const twitterThreshold = user.twitterThreshold || 1;
                if ((telegram && existingAlerts.filter(alert => alert.telegram === telegram).length >= telegramThreshold) ||
                    (twitter && existingAlerts.filter(alert => alert.twitter === twitter).length >= twitterThreshold)) {
                    console.log(`🚨 Doublon détecté pour ${user.chatId} avec seuil Telegram ${telegramThreshold} et Twitter ${twitterThreshold} !`);
                    sendTelegramAlertToUsers(`⚠️ Doublon trouvé !\nTelegram: ${telegram}\nTwitter: ${twitter}\nSymbol: ${symbol}`, telegram, twitter);
                }
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des données :", error.message);
    }
};

module.exports = { fetchAndStoreData };