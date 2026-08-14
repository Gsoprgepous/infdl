require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { orchestratePost } = require('./src/orchestrator');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files for easy demo access
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const preparedPosts = require('./data/prepared_posts.json');
let gameState = {
  sessionId: uuidv4(),
  day: 1,
  posts: [],
  agentStates: {}
};

try {
  const saved = fs.readFileSync('./data/game_state.json', 'utf8');
  if (saved) {
    gameState = JSON.parse(saved);
  }
} catch (e) {
  console.log('Новое состояние игры');
}

app.get('/api/prepared-posts', (req, res) => {
  res.json(preparedPosts);
});

app.get('/api/city/state', (req, res) => {
  res.json(gameState);
});

app.post('/api/day/trigger', async (req, res) => {
  // simple day progression: increment day and return updated state
  gameState.day = (gameState.day || 1) + 1;
  fs.writeFileSync('./data/game_state.json', JSON.stringify(gameState, null, 2));
  res.json({ ok: true, day: gameState.day, state: gameState });
});

app.post('/api/agents/:id/intervene', (req, res) => {
  const { id } = req.params;
  const action = req.body.action || 'support';
  const sessionId = req.body.sessionId || gameState.sessionId;
  if (!gameState.agentStates[id]) gameState.agentStates[id] = [];
  const note = { at: Date.now(), action, by: 'player' };
  gameState.agentStates[id].push(note);
  fs.writeFileSync('./data/game_state.json', JSON.stringify(gameState, null, 2));
  res.json({ ok: true, agent: id, action, note });
});

app.post('/api/calibration/answer', (req, res) => {
  const payload = req.body || {};
  const score = Number(payload.score || 50);
  const result = {
    correct: score >= 50,
    score,
    total: 100,
    label: score >= 70 ? 'High calibration' : score >= 40 ? 'Medium calibration' : 'Needs more calibration'
  };
  res.json(result);
});

app.post('/api/posts', async (req, res) => {
  const { postId } = req.body;
  const preparedPost = preparedPosts.find(p => p.id === postId);
  if (!preparedPost) {
    return res.status(404).json({ error: 'Пост не найден' });
  }

  const enrichedContent = {
    text: preparedPost.text,
    visual_description: preparedPost.visual_description,
    genre: preparedPost.genre,
    provocation_level: preparedPost.provocation_level,
    intent: preparedPost.intent,
  };

  const playerHistory = gameState.agentStates['player'] || 'Нет истории';

  const reactions = await orchestratePost(enrichedContent, playerHistory, gameState.day);

  const newPost = {
    id: uuidv4(),
    day: gameState.day,
    author: 'player',
    content: preparedPost.text,
    image_url: preparedPost.image_url,
    visual_description: preparedPost.visual_description,
    reactions: reactions
  };

  gameState.posts.push(newPost);

  reactions.forEach(reaction => {
    const agentId = reaction.agentId;
    if (!gameState.agentStates[agentId]) {
      gameState.agentStates[agentId] = [];
    }
    gameState.agentStates[agentId].push({
      day: gameState.day,
      playerAction: preparedPost.text,
      agentReaction: reaction.post_text
    });
    if (gameState.agentStates[agentId].length > 3) {
      gameState.agentStates[agentId].shift();
    }
  });

  fs.writeFileSync('./data/game_state.json', JSON.stringify(gameState, null, 2));

  res.json({ post: newPost, reactions: reactions });
});

app.get('/api/feed', (req, res) => {
  res.json(gameState.posts);
});

app.get('/api/final', (req, res) => {
  res.json({
    content: 'Анализ 3C2B будет доступен в конце игры.',
    c_content: 'Вы опубликовали 3 поста...',
    c_context: 'Контекст распространения...',
    c_consequence: 'Последствия: ...',
    b_business: 'Бизнес-уроки: ...',
    b_behavior: 'Поведенческие паттерны: ...'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Бекенд запущен на http://localhost:${PORT}`);
});
