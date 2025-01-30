# Utilisation de Node.js 18
FROM node:18

# Définition du dossier de travail
WORKDIR /app

# Copie des fichiers et installation des dépendances
COPY package*.json ./
RUN npm install

# Copie des fichiers restants
COPY . .

# Exposition du port (optionnel)
EXPOSE 3000

# Démarrage de l'application
CMD ["node", "index.js"]
