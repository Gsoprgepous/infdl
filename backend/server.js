require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createApiRouter } = require('./src/routes/api');
const { loadGameState } = require('./src/services/gameState');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files for easy demo access
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const preparedPosts = require('./data/prepared_posts.json');
let gameState = loadGameState();

app.use(
  '/api',
  createApiRouter({
    getState: () => gameState,
    setState: (next) => {
      gameState = next;
    },
    preparedPosts
  })
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Бекенд запущен на http://localhost:${PORT}`);
});
