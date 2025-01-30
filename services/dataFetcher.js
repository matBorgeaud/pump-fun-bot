const axios = require("axios");
const Alert = require("../models/Alert");
const { sendTelegramAlert } = require("./telegramBot");

const API_URL = "https://frontend-api.pump.fun/coins/latest";

const fetchAndStoreData = async () => {
    try {
        const response = await axios.get(API_URL);
        const { telegram, twitter } = response.data;

        if (!telegram && !twitter) return;

        // Vérifie si une alerte existe déjà
        const existingAlert = await Alert.findOne({ 
            $or: [{ telegram }, { twitter }] 
        });

        if (existingAlert) {
            console.log("🚨 Doublon détecté !");
            sendTelegramAlert(`⚠️ Doublon trouvé ! Telegram: ${telegram}, Twitter: ${twitter}`);
        }

        // Stocker la nouvelle donnée
        await Alert.create({ telegram, twitter });

    } catch (error) {
        console.error("❌ Erreur lors de la récupération des données :", error.message);
    }
};

module.exports = { fetchAndStoreData };
