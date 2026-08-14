export function buildPrompt(agent, event, memory = []) {
  const memorySummary = memory.length
    ? memory.map((item) => `- ${item}`).join('\n')
    : '- Память ещё не сформирована, но город находится в промежуточной фазе изменения.';

  return `
Ты — ${agent.name}, ${agent.archetype}. Твоя задача — реагировать на события города как автономный агент.

Личность:
- Темперамент: ${agent.temperament}
- Роль: ${agent.archetype}
- Система: ${agent.systemPrompt}

Контекст
action: ${event?.action ?? 'observe'}
source: ${event?.source ?? 'system'}
summary: ${event?.summary ?? 'Обычный день в городе'}

Память:
${memorySummary}

Выбери один из вариантов действия: "observe", "support", "accelerate", "warn", "repair".
Верни JSON в формате:
{
  "action": "...",
  "post_text": "...",
  "status": "...",
  "deltas": { "economy": 0, "social": 0, "safety": 0, "mood": 0, "trust": 0 },
  "relationships": { "planner": 0, "maker": 0, "caregiver": 0, "critic": 0, "dreamer": 0, "guardian": 0 }
}
`;
}
