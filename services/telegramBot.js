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

// Commande /setthreshold pour définir le seuil de doublons
bot.onText(/\/setthreshold (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const threshold = parseInt(match[1], 10);

    console.log(`/setthreshold command received from ${chatId} with threshold ${threshold}`);

    try {
        const user = await User.findOne({ chatId });
        if (user) {
            console.log(`User found: ${user.username} (${user.chatId})`);
            user.duplicateThreshold = threshold;
            await user.save();
            console.log(`Seuil de doublons mis à jour pour ${chatId} : ${threshold}`);
            bot.sendMessage(chatId, `🔢 Seuil de doublons mis à jour à ${threshold}.`);
        } else {
            console.log(`User not found: ${chatId}`);
            bot.sendMessage(chatId, "⚠️ Utilisateur non trouvé.");
        }
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour du seuil de doublons :", error);
        bot.sendMessage(chatId, "⚠️ Une erreur s'est produite.");
    }
});

// Fonction pour envoyer une alerte à tous les utilisateurs
const sendTelegramAlertToUsers = async (message, telegram, twitter) => {
    console.log(`Envoi d'une alerte : ${message}`);

    // Vérifier si le message contient une URL de statut
    const statusUrlPattern = /https:\/\/x\.com\/\w+\/status\/\d+/;
    if (statusUrlPattern.test(message)) {
        console.log("🔕 Alerte ignorée car elle contient une URL de statut.");
        return;
    }

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

module.exports = { bot, sendTelegramAlertToUsers };