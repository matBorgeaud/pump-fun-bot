require("dotenv").config();
const mongoose = require("./db"); // Connexion à MongoDB
const { fetchAndStoreData } = require("./services/dataFetcher");
const bot = require("./services/telegramBot");

const FETCH_INTERVAL = process.env.FETCH_INTERVAL || 5000; // Intervalle en ms (par défaut 5 sec)

console.log("🚀 Service lancé, récupération des données toutes", FETCH_INTERVAL / 1000, "secondes.");

setInterval(fetchAndStoreData, FETCH_INTERVAL);
