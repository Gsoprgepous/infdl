const { analyzeText } = require('./agents/analyzeText');
const { generateReaction } = require('./agents/generateReaction');
const { loadAgents } = require('./agents/loadAgents');

/**
 * Run all agents against a post and return reactions + aggregated city deltas.
 */
async function orchestratePost(enrichedContent, playerHistory, day) {
  // some agent/analyzer implementations may be async — await to be safe
  const analysis = await analyzeText(enrichedContent.text || '', {
    genre: enrichedContent.genre,
    intent: enrichedContent.intent,
    provocation_level: enrichedContent.provocation_level
  });

  const agents = loadAgents();

  // generateReaction может возвращать Promise; исполняем все параллельно и ждём
  const reactions = await Promise.all(
    agents.map((agent) =>
      generateReaction(analysis, agent, { day, playerHistory })
    )
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

  // Blend in analysis city impact (scaled lightly) — защитимся, если cityImpact отсутствует
  const cityImpact = analysis.cityImpact || {
    trustRisk: 0,
    anxietyRisk: 0,
    polarizationRisk: 0
  };

  cityDelta.trust -= Math.round((cityImpact.trustRisk || 0) * 3);
  cityDelta.anxiety += Math.round((cityImpact.anxietyRisk || 0) * 4);
  cityDelta.polarization += Math.round((cityImpact.polarizationRisk || 0) * 3);

  return {
    analysis,
    reactions,
    cityDelta,
    day
  };
}

module.exports = { orchestratePost };