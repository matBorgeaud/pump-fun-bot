const axios = require("axios");
const Alert = require("../models/Alert");
const { sendTelegramAlert } = require("./telegramBot");
const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/User");
require("dotenv").config();

const API_URL = "https://frontend-api.pump.fun/coins/latest";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN n'est pas défini.");
    process.exit(1);
}

console.log("✅ TELEGRAM_BOT_TOKEN récupéré avec succès : ", TELEGRAM_BOT_TOKEN);

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

console.log("✅ Bot démarré avec succès.");

// Commande /start pour inscrire l'utilisateur
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username || "Utilisateur inconnu";

    console.log(`/start command received from ${username} (${chatId})`);

    try {
        const existingUser = await User.findOne({ chatId });
        console.log(`Recherche d'utilisateur existant : ${existingUser}`);

        if (!existingUser) {
            await User.create({ chatId, username });
            console.log(`Utilisateur créé : ${username} (${chatId})`);
            bot.sendMessage(chatId, "✅ Inscription réussie ! Vous recevrez les alertes.");
        } else {
            console.log(`Utilisateur déjà inscrit : ${username} (${chatId})`);
            bot.sendMessage(chatId, "🔔 Vous êtes déjà inscrit.");
        }
    } catch (error) {
        console.error("❌ Erreur d'inscription :", error);
        bot.sendMessage(chatId, "⚠️ Une erreur s'est produite.");
    }
});

// Commande /stop pour se désinscrire
bot.onText(/\/stop/, async (msg) => {
    const chatId = msg.chat.id;

    console.log(`/stop command received from ${chatId}`);

    try {
        await User.deleteOne({ chatId });
        console.log(`Utilisateur désinscrit : ${chatId}`);
        bot.sendMessage(chatId, "❌ Désinscription réussie. Vous ne recevrez plus d'alertes.");
    } catch (error) {
        console.error("❌ Erreur de désinscription :", error);
        bot.sendMessage(chatId, "⚠️ Une erreur s'est produite.");
    }
});

// Commande /ignore pour ignorer les alertes pour un compte spécifique
bot.onText(/\/ignore (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const account = match[1];

    console.log(`/ignore command received from ${chatId} for account ${account}`);

    try {
        const user = await User.findOne({ chatId });
        if (user) {
            user.ignoredAccounts.push(account);
            await user.save();
            console.log(`Compte ignoré ajouté pour ${chatId} : ${account}`);
            bot.sendMessage(chatId, `🔕 Vous ne recevrez plus d'alertes pour ${account}.`);
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'ignorance de l'alerte :", error);
        bot.sendMessage(chatId, "⚠️ Une erreur s'est produite.");
    }
});

// Fonction pour envoyer une alerte à tous les utilisateurs
const sendTelegramAlertToUsers = async (message, telegram, twitter) => {
    console.log(`Envoi d'une alerte : ${message}`);
    try {
        const users = await User.find();
        for (const user of users) {
            // Vérifier si l'utilisateur a ignoré ce compte
            if (user.ignoredAccounts.includes(telegram) || user.ignoredAccounts.includes(twitter)) {
                continue;
            }

            console.log(`Envoi d'une alerte à ${user.chatId}`);
            const response = await bot.sendMessage(user.chatId, `🚨 ALERTE : ${message}\n\nPour ignorer les alertes pour ce compte, utilisez la commande /ignore <compte>`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: `Ignorer ${telegram}`, callback_data: `ignore_${telegram}` }],
                        [{ text: `Ignorer ${twitter}`, callback_data: `ignore_${twitter}` }]
                    ]
                }
            });
            console.log(`Réponse de Telegram : ${JSON.stringify(response)}`);
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'alerte :", error);
    }
};

const fetchAndStoreData = async () => {
    try {
        const response = await axios.get(API_URL);
        const { telegram, twitter, symbol } = response.data;

        if (!telegram && !twitter) return;

        // Vérifie si une alerte existe déjà
        const existingAlert = await Alert.findOne({ 
            $or: [{ telegram }, { twitter }] 
        });

        if (existingAlert) {
            console.log("🚨 Doublon détecté !");
            sendTelegramAlertToUsers(`⚠️ Doublon trouvé !\nTelegram: ${telegram}\nTwitter: ${twitter}\nSymbol: ${symbol}`, telegram, twitter);
        }

        // Stocker la nouvelle donnée
        await Alert.create({ telegram, twitter });

    } catch (error) {
        console.error("❌ Erreur lors de la récupération des données :", error.message);
    }
};

module.exports = { fetchAndStoreData, bot, sendTelegramAlertToUsers };
