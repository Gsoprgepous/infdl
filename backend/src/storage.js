import { agents } from './agents.js';

const sessions = new Map();

export function getDefaultCityState() {
  return {
    sessionId: 'demo-session',
    day: 1,
    metrics: {
      economy: 58,
      social: 62,
      safety: 57,
      mood: 60,
      trust: 63,
    },
    agents: agents.map((agent) => ({
      ...agent,
      energy: 60,
      trust: 50,
      focus: 55,
      relationshipScore: 0,
    })),
    feed: [
      {
        id: 'seed-1',
        agentId: 'planner',
        text: 'Рассвет в городе. Утренний план начинает собираться вокруг приоритетов на день.',
        kind: 'update',
      },
      {
        id: 'seed-2',
        agentId: 'caregiver',
        text: 'Соседи хотят тишины и стабильности: перед нами новая проверка на эмпатию.',
        kind: 'warning',
      },
    ],
    actionLog: [
      'Город проснулся и начал синхронизацию систем.',
      'Агенты подготовили первые сигналы к реорганизации дня.',
    ],
    selectedAgentId: 'planner',
    finale: null,
  };
}

export function getOrCreateSession(sessionId = 'demo-session') {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, getDefaultCityState());
  }

  return sessions.get(sessionId);
}

export function saveSession(sessionId, state) {
  sessions.set(sessionId, state);
  return state;
}
