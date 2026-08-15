/**
 * Generate a personality-aware reaction from text analysis + agent profile.
 */

const ACTION_BASE_DELTAS = {
  flag: { trust: -2, anxiety: 2, polarization: 1 },
  doubt: { trust: -1, anxiety: 1, polarization: 0 },
  amplify: { trust: -1, anxiety: 2, polarization: 2 },
  share: { trust: 0, anxiety: 1, polarization: 1 },
  support: { trust: 1, anxiety: -1, polarization: -1 },
  question: { trust: 0, anxiety: 0, polarization: 0 },
  critique: { trust: 0, anxiety: 0, polarization: 1 },
  analyze: { trust: 1, anxiety: -1, polarization: -1 },
  ignore: { trust: 0, anxiety: 0, polarization: 0 }
};

function pick(arr) {
  if (!arr || !arr.length) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

function chooseAction(agent, analysis) {
  const fake = analysis.fakeScore || 0;
  const role = agent.role || agent.archetype || '';
  const sk = agent.traits?.skepticism ?? agent.skepticism_score ?? 0.5;
  const emp = agent.traits?.empathy ?? 0.5;
  const optimism = agent.traits?.optimism ?? 0.3;
  const medical = agent.traits?.medical ?? 0;
  const conspiracy = agent.traits?.conspiracy ?? 0;
  const critical = agent.traits?.critical ?? 0.4;
  const curiosity = agent.traits?.curiosity ?? 0.4;

  // Role-biased thresholds
  if (role === 'skeptic' || /скепт/i.test(role)) {
    if (fake > 0.35 || !analysis.hasLink) return 'doubt';
    return fake > 0.2 ? 'question' : 'analyze';
  }
  if (role === 'analyst' || /аналит/i.test(role)) {
    return fake > 0.45 ? 'doubt' : 'analyze';
  }
  if (role === 'doctor' || /врач/i.test(role)) {
    if (analysis.topic === 'health' || analysis.medicalHits > 0) {
      return fake > 0.4 ? 'flag' : 'critique';
    }
    return fake > 0.6 ? 'doubt' : 'analyze';
  }
  if (role === 'optimist' || /оптим/i.test(role)) {
    return fake > 0.75 ? 'question' : 'support';
  }
  if (role === 'theorist' || /теорет/i.test(role)) {
    return conspiracy > 0.5 && fake > 0.3 ? 'amplify' : 'analyze';
  }
  if (role === 'empath' || /эмпат/i.test(role)) {
    return analysis.sentiment === 'alarm' ? 'support' : emp > 0.6 ? 'support' : 'question';
  }
  if (role === 'expert' || /эксперт/i.test(role)) {
    return fake > 0.5 ? 'critique' : 'analyze';
  }
  if (role === 'critic' || /критик/i.test(role)) {
    return fake > 0.3 ? 'critique' : critical > 0.6 ? 'doubt' : 'question';
  }
  if (role === 'researcher' || /исследоват/i.test(role)) {
    return fake > 0.55 ? 'doubt' : 'analyze';
  }
  if (role === 'student' || /студент/i.test(role)) {
    return curiosity > 0.5 ? 'question' : 'doubt';
  }
  if (role === 'ai' || /nova|ai/i.test(role) || /nova/i.test(agent.name || '')) {
    if (fake > 0.65) return 'flag';
    if (fake > 0.4) return 'doubt';
    return 'analyze';
  }

  // Generic fallback using traits
  if (fake > 0.7 && sk > 0.5) return 'flag';
  if (fake > 0.45) return sk > 0.55 ? 'doubt' : 'amplify';
  if (optimism > 0.6) return 'support';
  if (medical > 0.5 && analysis.topic === 'health') return 'critique';
  return 'question';
}

function buildReply(agent, analysis, action) {
  const templates = (agent.templates && agent.templates[action]) || [];
  let line = pick(templates);
  if (!line) {
    const fallback = {
      flag: 'This looks harmful — we should not spread it.',
      doubt: 'I am not sure this is true. Source?',
      amplify: 'This will spread fast…',
      share: 'Sharing for visibility.',
      support: 'Stay calm — we can check this together.',
      question: 'What is the original source of this claim?',
      critique: 'The argument has gaps; conclusions jump ahead of evidence.',
      analyze: 'Signals: emotion vs evidence. Fake-likelihood looks mixed.',
      ignore: '…'
    };
    line = fallback[action] || 'Interesting.';
  }

  // Light personalization with analysis snippets
  if (action === 'analyze' || action === 'doubt') {
    const bits = [];
    if (analysis.indicators.critical.includes('no_source')) bits.push('no clear source');
    if (analysis.indicators.important.includes('emotional_words')) bits.push('emotional wording');
    if (analysis.indicators.important.includes('caps_lock')) bits.push('caps');
    if (bits.length && !line.includes(bits[0])) {
      line += ` (${bits.slice(0, 2).join(', ')}; score ${analysis.fakeScore})`;
    }
  }

  return `${agent.name}: ${line}`;
}

function generateReaction(analysis, agent) {
  const action = chooseAction(agent, analysis);
  const base = ACTION_BASE_DELTAS[action] || ACTION_BASE_DELTAS.ignore;

  // Scale deltas by fake risk and agent influence
  const influence = agent.influence ?? 1;
  const risk = analysis.fakeScore || 0;
  const trust_delta = Math.round(base.trust * influence * (action === 'support' ? 1 : 0.6 + risk));
  const anxiety_delta = Math.round(base.anxiety * influence * (0.5 + risk));
  const polarization_delta = Math.round(base.polarization * influence * (0.5 + risk));

  const confidence = Math.max(
    0.2,
    Math.min(
      0.95,
      0.4 + (agent.traits?.skepticism || 0.4) * 0.3 + Math.abs(0.5 - risk) * 0.4
    )
  );

  return {
    agentId: agent.id,
    agentName: agent.name,
    role: agent.role || agent.archetype,
    action,
    post_text: buildReply(agent, analysis, action),
    sentiment: analysis.sentiment,
    confidence: Math.round(confidence * 100) / 100,
    trust_delta,
    anxiety_delta,
    polarization_delta,
    analysisSnapshot: {
      fakeScore: analysis.fakeScore,
      topic: analysis.topic,
      indicators: analysis.indicators
    },
    internal_note: `${agent.role || agent.archetype} reacted via heuristics`
  };
}

module.exports = { generateReaction, chooseAction };
