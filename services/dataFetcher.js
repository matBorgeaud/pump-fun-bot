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
        const existingAlerts = await Alert.find({ 
            $or: [{ telegram }, { twitter }] 
        });

        // Stocker la nouvelle donnée
        await Alert.create({ telegram, twitter });

        if (existingAlerts.length > 0) {
            const users = await User.find();
            for (const user of users) {
                const threshold = user.duplicateThreshold || 1;
                if (existingAlerts.length >= threshold) {
                    console.log(`🚨 Doublon détecté pour ${user.chatId} avec seuil ${threshold} !`);
                    sendTelegramAlertToUsers(`⚠️ Doublon trouvé !\nTelegram: ${telegram}\nTwitter: ${twitter}\nSymbol: ${symbol}`, telegram, twitter);
                }
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des données :", error.message);
    }
};

module.exports = { fetchAndStoreData };