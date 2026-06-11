/**
 * Intent Classification Agent
 * Classifies user query into an intent with a confidence score.
 */

const INTENT_PATTERNS = [
  {
    intent: 'team',
    patterns: [/\bteam\b/i, /\bteams\b/i, /\bteamid\b/i, /\bt0\d\d\b/i],
    weight: 10,
  },
  {
    intent: 'member',
    patterns: [/\bmember\b/i, /\bmembers\b/i, /\bmemberid\b/i, /\bm0\d\d\b/i, /\bperson\b/i, /\bstaff\b/i, /\bemployee\b/i, /\bpeople\b/i],
    weight: 10,
  },
  {
    intent: 'project',
    patterns: [/\bproject\b/i, /\bprojects\b/i, /\bdomain\b/i, /\bsolution\b/i, /\bproblem\b/i, /\btech stack\b/i, /\btechnology\b/i, /\bframework\b/i, /\brole\b/i, /\bcompleted\b/i, /\bongoing\b/i],
    weight: 8,
  },
  {
    intent: 'analytics',
    patterns: [/\bhow many\b/i, /\bcount\b/i, /\btotal\b/i, /\baverage\b/i, /\bhighest\b/i, /\bmax\b/i, /\blowest\b/i, /\bmin\b/i, /\btrend\b/i, /\bstatistics\b/i, /\bsummary\b/i, /\bdistribution\b/i],
    weight: 9,
  },
  {
    intent: 'insight',
    patterns: [/\binsight\b/i, /\banalyz\b/i, /\bcompar\b/i, /\bbest\b/i, /\bperform\b/i, /\brecommend\b/i, /\bwhy\b/i, /\bwhat can\b/i],
    weight: 7,
  },
  {
    intent: 'dataset',
    patterns: [/\bdataset\b/i, /\bschema\b/i, /\bcolumns\b/i, /\bfields\b/i, /\brows\b/i, /\brecords\b/i, /\buploaded\b/i],
    weight: 6,
  },
];

/**
 * @param {string} query
 * @returns {{ intent: string, confidence: number, scores: Record<string, number> }}
 */
export function classifyIntent(query) {
  const scores = {};

  for (const { intent, patterns, weight } of INTENT_PATTERNS) {
    const hits = patterns.filter((p) => p.test(query)).length;
    if (hits > 0) scores[intent] = (scores[intent] ?? 0) + hits * weight;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (!sorted.length) {
    return { intent: 'rag', confidence: 0.4, scores: {} };
  }

  const [topIntent, topScore] = sorted[0];
  const total = sorted.reduce((s, [, v]) => s + v, 0);
  const confidence = Math.min(0.99, parseFloat((topScore / total).toFixed(2)));

  return { intent: topIntent, confidence, scores: Object.fromEntries(sorted) };
}
