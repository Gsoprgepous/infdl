const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const STATE_PATH = path.join(__dirname, '..', '..', 'data', 'game_state.json');

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function defaultState() {
  return {
    sessionId: uuidv4(),
    day: 1,
    posts: [],
    agentStates: {},
    actionsRemaining: 5,
    actionsMax: 5,
    actionLog: [],
    cityMetrics: {
      trust: 62,
      anxiety: 28,
      polarization: 35
    }
  };
}

function loadGameState() {
  try {
    const saved = fs.readFileSync(STATE_PATH, 'utf8');
    if (!saved) return defaultState();
    const parsed = JSON.parse(saved);
    if (!parsed.cityMetrics) {
      parsed.cityMetrics = { trust: 62, anxiety: 28, polarization: 35 };
    }
    if (!parsed.sessionId) parsed.sessionId = uuidv4();
    if (!Array.isArray(parsed.posts)) parsed.posts = [];
    if (!parsed.agentStates) parsed.agentStates = {};
    if (typeof parsed.actionsRemaining !== 'number') parsed.actionsRemaining = 5;
    if (typeof parsed.actionsMax !== 'number') parsed.actionsMax = 5;
    if (!Array.isArray(parsed.actionLog)) parsed.actionLog = [];
    return parsed;
  } catch (e) {
    console.log('Новое состояние игры');
    return defaultState();
  }
}

function saveGameState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function applyCityDelta(state, cityDelta = {}) {
  if (!state.cityMetrics) {
    state.cityMetrics = { trust: 62, anxiety: 28, polarization: 35 };
  }
  state.cityMetrics.trust = clamp(
    (state.cityMetrics.trust || 50) + (cityDelta.trust || 0),
    0,
    100
  );
  state.cityMetrics.anxiety = clamp(
    (state.cityMetrics.anxiety || 30) + (cityDelta.anxiety || 0),
    0,
    100
  );
  state.cityMetrics.polarization = clamp(
    (state.cityMetrics.polarization || 30) + (cityDelta.polarization || 0),
    0,
    100
  );
  return state.cityMetrics;
}

function recordAgentMemories(state, reactions, playerText, day) {
  reactions.forEach((reaction) => {
    const agentId = reaction.agentId;
    if (!state.agentStates[agentId]) state.agentStates[agentId] = [];
    state.agentStates[agentId].push({
      day,
      playerAction: playerText,
      agentReaction: reaction.post_text,
      action: reaction.action
    });
    if (state.agentStates[agentId].length > 5) {
      state.agentStates[agentId].shift();
    }
  });
}

module.exports = {
  STATE_PATH,
  loadGameState,
  saveGameState,
  applyCityDelta,
  recordAgentMemories,
  defaultState,
  clamp
};
