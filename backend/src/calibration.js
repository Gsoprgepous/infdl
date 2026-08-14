const calibrationPairs = [
  { prompt: 'Сравните поведенческие признаки городской стабильности.', optionA: 'A', optionB: 'B' },
  { prompt: 'Определите, что усиливает доверие между жителями.', optionA: 'A', optionB: 'B' },
  { prompt: 'Какой сигнал лучше отражает рост общественной поддержки?', optionA: 'A', optionB: 'B' },
  { prompt: 'Что вероятнее улучшает экономический баланс?', optionA: 'A', optionB: 'B' },
  { prompt: 'Как правильнее оценить риск без паники?', optionA: 'A', optionB: 'B' },
];

export function evaluateCalibration(answer) {
  const score = Number(answer?.score ?? 0);
  return {
    correct: score >= 50,
    score,
    total: 100,
    label: score >= 70 ? 'Высокая чувствительность к городской динамике' : score >= 40 ? 'Средняя чувствительность' : 'Нужна дополнительная калибровка',
    pairs: calibrationPairs,
  };
}
