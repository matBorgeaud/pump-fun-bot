const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/User");
require("dotenv").config();

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

// Fonction pour envoyer une alerte à tous les utilisateurs
const sendTelegramAlert = async (message) => {
    console.log(`Envoi d'une alerte : ${message}`);
    try {
        const users = await User.find();
        for (const user of users) {
            console.log(`Envoi d'une alerte à ${user.chatId}`);
            const response = await bot.sendMessage(user.chatId, `🚨 ALERTE : ${message}`);
            console.log(`Réponse de Telegram : ${JSON.stringify(response)}`);
        }
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'alerte :", error);
    }
};

module.exports = { bot, sendTelegramAlert };
