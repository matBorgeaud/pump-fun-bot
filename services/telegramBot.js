const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/User");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Commande /start pour inscrire l'utilisateur
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username || "Utilisateur inconnu";

    try {
        const existingUser = await User.findOne({ chatId });

        if (!existingUser) {
            await User.create({ chatId, username });
            bot.sendMessage(chatId, "✅ Inscription réussie ! Vous recevrez les alertes.");
        } else {
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

    try {
        await User.deleteOne({ chatId });
        bot.sendMessage(chatId, "❌ Désinscription réussie. Vous ne recevrez plus d'alertes.");
    } catch (error) {
        console.error("❌ Erreur de désinscription :", error);
        bot.sendMessage(chatId, "⚠️ Une erreur s'est produite.");
    }
});

// Fonction pour envoyer une alerte à tous les utilisateurs
const sendTelegramAlert = async (message) => {
    try {
        const users = await User.find();
        for (const user of users) {
            bot.sendMessage(user.chatId, `🚨 ALERTE : ${message}`);
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'alerte :", error);
    }
};

module.exports = { bot, sendTelegramAlert };
