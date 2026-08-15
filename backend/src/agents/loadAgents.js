const path = require('path');
const fs = require('fs');

let cached = null;

function loadAgents() {
  if (cached) return cached;
  const file = path.join(__dirname, '..', '..', 'data', 'agents.json');
  const raw = fs.readFileSync(file, 'utf8');
  cached = JSON.parse(raw);
  return cached;
}

function getAgentById(id) {
  return loadAgents().find((a) => a.id === id) || null;
}

function reloadAgents() {
  cached = null;
  return loadAgents();
}

module.exports = { loadAgents, getAgentById, reloadAgents };
