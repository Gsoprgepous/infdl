import { agents } from './agents.js';
import { buildPrompt } from './promptBuilder.js';
import { callClaude } from './claude.js';

export async function processEvent(state, event) {
  const memory = state.actionLog.slice(-6);
  const agentResponses = [];

  for (const agent of agents) {
    const prompt = buildPrompt(agent, event, memory);
    const result = await callClaude(prompt);

    agentResponses.push({
      agentId: agent.id,
      action: result.action,
      post_text: result.post_text,
      status: result.status,
      deltas: result.deltas ?? {},
      relationships: result.relationships ?? {},
    });
  }

  const metricDeltas = { economy: 0, social: 0, safety: 0, mood: 0, trust: 0 };

  for (const item of agentResponses) {
    for (const [key, value] of Object.entries(item.deltas)) {
      metricDeltas[key] = (metricDeltas[key] ?? 0) + Number(value || 0);
    }
  }

  state.day += 1;
  state.metrics = {
    economy: clamp(state.metrics.economy + metricDeltas.economy / 2, 0, 100),
    social: clamp(state.metrics.social + metricDeltas.social / 2, 0, 100),
    safety: clamp(state.metrics.safety + metricDeltas.safety / 2, 0, 100),
    mood: clamp(state.metrics.mood + metricDeltas.mood / 2, 0, 100),
    trust: clamp(state.metrics.trust + metricDeltas.trust / 2, 0, 100),
  };

  state.feed.unshift(
    ...agentResponses.map((response) => ({
      id: `${Date.now()}-${response.agentId}`,
      agentId: response.agentId,
      text: response.post_text,
      kind: response.action,
    })),
  );

  state.actionLog.unshift(`Новый день: ${event.summary ?? 'Событие города'}; агенты дали ${agentResponses.length} реакций.`);
  state.selectedAgentId = state.selectedAgentId ?? agents[0].id;

  return { agentResponses, state, metrics: state.metrics };
}

export async function handleIntervention(state, agentId, action) {
  const agent = agents.find(({ id }) => id === agentId);
  if (!agent) {
    return { error: 'Agent not found' };
  }

  const response = {
    agentId,
    agentName: agent.name,
    action,
    text: `${agent.name} вмешивается: ${action} — решение принято через локальный механизм координации.`,
  };

  state.feed.unshift({
    id: `intervention-${Date.now()}`,
    agentId,
    text: response.text,
    kind: 'intervention',
  });

  state.actionLog.unshift(`${agent.name} активировал действие: ${action}`);
  state.metrics = {
    economy: clamp(state.metrics.economy + 2, 0, 100),
    social: clamp(state.metrics.social + 1, 0, 100),
    safety: clamp(state.metrics.safety + 1, 0, 100),
    mood: clamp(state.metrics.mood + 2, 0, 100),
    trust: clamp(state.metrics.trust + 2, 0, 100),
  };

  return response;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
