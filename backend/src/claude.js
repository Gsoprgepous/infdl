import Anthropic from '@anthropic-ai/sdk';

export async function callClaude(prompt) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      action: 'observe',
      post_text: 'Симуляция работает в демо-режиме. Claude API пока не подключён.',
      status: 'fallback',
      deltas: {
        economy: 1,
        social: 1,
        safety: 0,
        mood: 2,
        trust: 1,
      },
      relationships: {
        planner: 1,
        maker: 1,
        caregiver: 1,
      },
    };
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const rawText = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n');

  try {
    return JSON.parse(rawText.replace(/```json|```/g, '').trim());
  } catch {
    return {
      action: 'observe',
      post_text: rawText.slice(0, 180),
      status: 'parsed-fallback',
      deltas: {
        economy: 0,
        social: 0,
        safety: 0,
        mood: 0,
        trust: 0,
      },
      relationships: {},
    };
  }
}
