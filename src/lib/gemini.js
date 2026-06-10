const GEMINI_ENDPOINT = import.meta.env.VITE_GEMINI_ENDPOINT;
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

function safeJoin(arr, sep = '\n\n') {
  return arr.filter(Boolean).join(sep);
}

export function buildPrompt(dataset, question, matches = []) {
  const system = `You are KnowledgeHub AI, a dataset-aware assistant. Use the provided dataset summary and retrieved rows to answer the user's question concisely. Always cite the source as 'Dataset Row N' if the answer comes from a specific row.`;

  const context = [];
  if (dataset?.summary) context.push(`Dataset summary:\n${dataset.summary}`);

  if (matches.length) {
    context.push('Top relevant rows:');
    matches.forEach((m, idx) => {
      const md = m.metadata || {};
      context.push(`Row ${m.id || idx + 1}: ${m.text}\nMetadata: ${JSON.stringify(md)}`);
    });
  }

  const prompt = `${system}\n\n${safeJoin(context)}\n\nUser question: ${question}\n\nAnswer in plain text and include a Source line.`;
  return { system, prompt };
}

export async function callGemini(promptBody, opts = {}) {
  if (!GEMINI_ENDPOINT || !GEMINI_KEY) {
    throw new Error('Gemini not configured. Set VITE_GEMINI_ENDPOINT and VITE_GEMINI_API_KEY in your env.');
  }

  const body = {
    prompt: promptBody,
    max_tokens: opts.maxTokens ?? 512,
    temperature: opts.temperature ?? 0.0,
  };

  const res = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GEMINI_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  // Support common shape: { text } or { choices: [{ text }] }
  if (data.text) return data.text;
  if (Array.isArray(data.choices) && data.choices[0]?.text) return data.choices[0].text;
  return JSON.stringify(data);
}

export default { buildPrompt, callGemini };
