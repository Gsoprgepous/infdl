const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.example/v1/generate';

async function callDeepSeek(prompt, opts = {}) {
  // Use global fetch if available (Node 18+), otherwise try dynamic import of node-fetch
  let fetchImpl = global.fetch;
  if (!fetchImpl) {
    try {
      // eslint-disable-next-line node/no-unsupported-features/es-syntax
      const mod = await import('node-fetch');
      fetchImpl = mod.default || mod;
    } catch (err) {
      throw new Error('No fetch available. Install node-fetch or run on Node 18+.');
    }
  }

  const body = {
    prompt,
    max_tokens: opts.max_tokens || 800,
    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.2
  };

  const res = await fetchImpl(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  return text;
}

module.exports = { callDeepSeek };
