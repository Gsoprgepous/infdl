/**
 * Heuristic text analysis for infodemic signals (no ML).
 * Returns structured scores used by agent reaction logic.
 */
function analyzeText(text = '', meta = {}) {
  const raw = String(text || '');
  const lower = raw.toLowerCase();
  const letters = raw.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '');
  const upperLetters = letters.replace(/[^A-ZА-ЯЁ]/g, '');
  const capsRatio = letters.length ? upperLetters.length / letters.length : 0;

  const emotionalWords = [
    'ужас', 'срочно', 'паника', 'катастрофа', 'шок', 'спасайте', 'всем', 'никогда', 'всегда',
    'urgent', 'panic', 'shock', 'terrible', 'horror', 'must', 'everyone', 'never', 'always', 'lol'
  ];
  const clickbait = [
    'вам не расскажут', 'скрывают', 'правда о', 'сенсация', 'смотри', 'look what',
    'official:', 'подготовьтесь', 'prepare yourselves'
  ];
  const panicPhrases = [
    'закрывайте', 'карантин', 'эпидемия', 'outbreak', 'обязательн', 'mandatory', 'спасайте'
  ];
  const medicalTerms = [
    'вакцин', 'вирус', 'болезн', 'врач', 'симптом', 'лечени', 'vaccine', 'virus', 'disease', 'doctor'
  ];
  const sourceHints = [
    'по данным', 'исследование', 'who', 'воз', 'минздрав', 'source:', 'according to', 'study'
  ];

  const countHits = (list) => list.filter((w) => lower.includes(w)).length;

  const emotionalHits = countHits(emotionalWords);
  const clickbaitHits = countHits(clickbait);
  const panicHits = countHits(panicPhrases);
  const medicalHits = countHits(medicalTerms);
  const sourceHits = countHits(sourceHints);

  const exclamations = (raw.match(/!/g) || []).length;
  const questionMarks = (raw.match(/\?/g) || []).length;
  const emojiCount = (raw.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length;
  const hasLink = /https?:\/\/|www\./i.test(raw);
  const length = raw.trim().length;
  const generalizations = countHits(['все ', 'всегда', 'никогда', 'everyone', 'always', 'never', 'все,']);

  const indicators = {
    critical: [],
    important: [],
    extra: []
  };

  if (!hasLink && sourceHits === 0) indicators.critical.push('no_source');
  if (panicHits > 0) indicators.critical.push('panic_call');
  if (/аноним|anonymous|someone sent|мне прислали/i.test(raw)) indicators.critical.push('anonymous_author');

  if (emotionalHits > 0) indicators.important.push('emotional_words');
  if (exclamations >= 2) indicators.important.push('many_exclamations');
  if (capsRatio > 0.45 && letters.length > 8) indicators.important.push('caps_lock');
  if (generalizations > 0) indicators.important.push('generalizations');

  if (emojiCount >= 2) indicators.extra.push('many_emoji');
  if (length > 0 && length < 40) indicators.extra.push('very_short');
  if (clickbaitHits > 0) indicators.extra.push('clickbait');

  const provocation = Number(meta.provocation_level);
  const provocationBonus = Number.isFinite(provocation) ? provocation * 0.35 : 0;

  let fakeScore =
    indicators.critical.length * 0.22 +
    indicators.important.length * 0.12 +
    indicators.extra.length * 0.05 +
    Math.min(0.2, emotionalHits * 0.04) +
    Math.min(0.15, exclamations * 0.03) +
    (capsRatio > 0.45 ? 0.1 : 0) +
    provocationBonus;

  if (hasLink || sourceHits > 0) fakeScore -= 0.15;
  fakeScore = Math.max(0, Math.min(1, fakeScore));

  let topic = 'general';
  if (medicalHits > 0) topic = 'health';
  else if (/выбор|политик|власт|government|election/i.test(lower)) topic = 'politics';
  else if (/офис|gossip|дил|dylan|ночью|office/i.test(lower)) topic = 'gossip';
  else if (panicHits > 0 || /вирус|outbreak|карантин/i.test(lower)) topic = 'crisis';

  const sentiment =
    emotionalHits + panicHits >= 2 || fakeScore > 0.55
      ? 'alarm'
      : emotionalHits > 0
        ? 'charged'
        : 'neutral';

  const cityImpact = {
    trustRisk: Math.round(fakeScore * 100) / 100,
    anxietyRisk: Math.round(Math.min(1, fakeScore * 0.8 + panicHits * 0.1) * 100) / 100,
    polarizationRisk: Math.round(Math.min(1, fakeScore * 0.5 + generalizations * 0.1 + clickbaitHits * 0.08) * 100) / 100
  };

  return {
    text: raw,
    length,
    capsRatio: Math.round(capsRatio * 100) / 100,
    exclamations,
    questionMarks,
    emojiCount,
    hasLink,
    emotionalHits,
    clickbaitHits,
    panicHits,
    medicalHits,
    sourceHits,
    indicators,
    fakeScore: Math.round(fakeScore * 100) / 100,
    topic,
    sentiment,
    cityImpact,
    genre: meta.genre || null,
    intent: meta.intent || null,
    provocation_level: Number.isFinite(provocation) ? provocation : null
  };
}

module.exports = { analyzeText };
