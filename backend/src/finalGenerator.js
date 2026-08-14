export function generateFinale(state) {
  const metrics = state.metrics;
  const before = {
    economy: 45,
    social: 48,
    safety: 46,
    mood: 50,
    trust: 49,
  };

  const diff = {
    economy: metrics.economy - before.economy,
    social: metrics.social - before.social,
    safety: metrics.safety - before.safety,
    mood: metrics.mood - before.mood,
    trust: metrics.trust - before.trust,
  };

  const status =
    diff.economy >= 0 && diff.social >= 0 && diff.safety >= 0
      ? 'город становится устойчивее'
      : 'город сохраняет хрупкий баланс';

  return {
    status,
    before,
    after: metrics,
    summary: `За время наблюдения город изменился: экономика ${formatDelta(diff.economy)}, социальная структура ${formatDelta(diff.social)}, безопасность ${formatDelta(diff.safety)}, настроение ${formatDelta(diff.mood)}, доверие ${formatDelta(diff.trust)}.`,
  };
}

function formatDelta(value) {
  if (value > 0) return `+${value.toFixed(1)}`;
  if (value < 0) return `${value.toFixed(1)}`;
  return '0';
}
