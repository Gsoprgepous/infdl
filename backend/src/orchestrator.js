const { analyzeText } = require('./agents/analyzeText');
const { generateReaction } = require('./agents/generateReaction');
const { loadAgents } = require('./agents/loadAgents');

/**
 * Run all agents against a post and return reactions + aggregated city deltas.
 */
async function orchestratePost(enrichedContent, playerHistory, day) {
  const analysis = analyzeText(enrichedContent.text || '', {
    genre: enrichedContent.genre,
    intent: enrichedContent.intent,
    provocation_level: enrichedContent.provocation_level
  });

  const agents = loadAgents();
  const reactions = agents.map((agent) =>
    generateReaction(analysis, agent, { day, playerHistory })
  );

  const cityDelta = reactions.reduce(
    (acc, r) => {
      acc.trust += r.trust_delta || 0;
      acc.anxiety += r.anxiety_delta || 0;
      acc.polarization += r.polarization_delta || 0;
      return acc;
    },
    { trust: 0, anxiety: 0, polarization: 0 }
  );

  // Blend in analysis city impact (scaled lightly)
  cityDelta.trust -= Math.round(analysis.cityImpact.trustRisk * 3);
  cityDelta.anxiety += Math.round(analysis.cityImpact.anxietyRisk * 4);
  cityDelta.polarization += Math.round(analysis.cityImpact.polarizationRisk * 3);

  return {
    analysis,
    reactions,
    cityDelta,
    day
  };
}

module.exports = { orchestratePost };
