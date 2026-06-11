/**
 * RAG Agent
 * In-browser semantic retrieval using token-overlap scoring over dataset documents.
 */

/**
 * @param {object} dataset
 * @param {string} query
 * @param {number} topK
 * @returns {{ context: string, docs: object[], sources: string }}
 */
export function runRagAgent(dataset, query, topK = 5) {
  const queryTokens = tokenize(query).filter((t) => t.length > 1);

  const scored = dataset.documents
    .map((doc) => {
      const searchText = `${doc.text} ${Object.values(doc.metadata).join(' ')}`.toLowerCase();
      const score = queryTokens.reduce((s, t) => s + (searchText.includes(t) ? 2 : 0), 0);
      return { ...doc, score };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (!scored.length) {
    return { context: '', docs: [], sources: 'No relevant documents found' };
  }

  const context = scored.map((d, i) => `[Row ${d.metadata?.fileRow ?? i + 1}]\n${d.text}`).join('\n\n---\n\n');
  const sources = scored.map((d) => `Dataset Row ${d.metadata?.fileRow ?? '?'}`).join(', ');

  return { context, docs: scored, sources };
}

function tokenize(text) {
  return String(text).toLowerCase().match(/[a-z0-9]+/g) ?? [];
}
