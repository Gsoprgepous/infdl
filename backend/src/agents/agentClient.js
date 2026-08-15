const { analyzeText } = require('./analyzeText');
const { generateReaction } = require('./generateReaction');

/**
 * Compatibility wrapper used by older call sites.
 * Prefer orchestrator + generateReaction for new code.
 */
function simulateAgentResponse(agent, enrichedContent, context = null) {
  const analysis =
    (context && context.analysis) ||
    analyzeText(enrichedContent.text || '', {
      genre: enrichedContent.genre,
      intent: enrichedContent.intent,
      provocation_level: enrichedContent.provocation_level
    });
  return generateReaction(analysis, agent);
}

async function callAgent(agent, enrichedContent, playerHistory, context = null) {
  try {
    return simulateAgentResponse(agent, enrichedContent, context);
  } catch (err) {
    console.error('callAgent fallback error', err);
    return {
      agentId: agent.id,
      action: 'ignore',
      post_text: `${agent.name} промолчал (ошибка).`,
      trust_delta: 0,
      anxiety_delta: 0,
      polarization_delta: 0,
      internal_note: 'callAgent error'
    };
  }
}

module.exports = { callAgent, simulateAgentResponse };
