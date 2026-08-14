// Simplified agent client for demo: use deterministic local simulation
// This avoids calling external Claude during local tests and demo runs.
// If you later want real Claude calls, replace this with SDK invocation guarded by API key.

function simulateAgentResponse(agent, enrichedContent, context = null) {
  // Basic heuristics based on archetype and provocation level
  const p = enrichedContent.provocation_level || 0;
  let action = 'ignore';
  if (/паник/i.test(agent.archetype)) {
    action = p > 0.4 ? 'flag' : 'doubt';
  } else if (/провок/i.test(agent.archetype)) {
    action = p > 0.2 ? 'amplify' : 'share';
  } else if (/скепт/i.test(agent.archetype) || /скеп/i.test(agent.archetype)) {
    action = 'doubt';
  } else if (/модератор/i.test(agent.archetype)) {
    action = p > 0.7 ? 'flag' : 'ignore';
  } else if (/AI-усилитель/i.test(agent.archetype) || /nova/i.test(agent.name.toLowerCase())) {
    action = 'share';
  }

  const shortReplies = {
    flag: 'Нельзя так, нужно удалить.',
    doubt: 'Не уверен в правдивости, стоит проверить.',
    amplify: '🔥 Это должно стать вирусным!',
    share: 'Поделюсь этим.',
    ignore: '...' 
  };

  const post_text = `${agent.name}: ${shortReplies[action] || 'Интересно.'}`;
  const trust_delta = action === 'flag' ? -2 : action === 'share' ? 1 : 0;
  const anxiety_delta = action === 'flag' ? 2 : action === 'doubt' ? 1 : 0;

  return {
    agentId: agent.id,
    action,
    post_text,
    trust_delta,
    anxiety_delta,
    internal_note: `Simulated by archetype ${agent.archetype}`
  };
}

async function callAgent(agent, enrichedContent, playerHistory, context = null) {
  try {
    // If a real API key is present and you want live calls, implement them here.
    // For the demo we use simulation to ensure stable, offline behavior.
    return simulateAgentResponse(agent, enrichedContent, context);
  } catch (err) {
    console.error('callAgent fallback error', err);
    return {
      agentId: agent.id,
      action: 'ignore',
      post_text: `${agent.name} промолчал (ошибка).`,
      trust_delta: 0,
      anxiety_delta: 0,
      internal_note: 'callAgent error'
    };
  }
}

module.exports = { callAgent };
