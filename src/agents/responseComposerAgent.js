/**
 * Response Composer Agent
 * Assembles the final structured response with execution metadata.
 */

/**
 * @param {{
 *   text: string,
 *   agentUsed: string,
 *   executionFlow: string[],
 *   confidence: number,
 *   sources: string,
 * }} params
 * @returns {{ text: string, meta: object }}
 */
export function composeResponse({ text, agentUsed, executionFlow, confidence, sources }) {
  const confidenceLabel =
    confidence >= 0.8 ? 'High' : confidence >= 0.5 ? 'Medium' : 'Low';

  return {
    text,
    meta: {
      agent: agentUsed,
      executionFlow: executionFlow.join(' → '),
      confidence: `${confidenceLabel} (${Math.round(confidence * 100)}%)`,
      sources,
    },
  };
}
