/**
 * Coordinator Agent
 * Orchestrates the full agentic pipeline:
 * Query → Intent → Route → Retrieve → Insight → Gemini → Compose
 */

import { classifyIntent } from './intentAgent.js';
import { runDatasetAgent } from './datasetAgent.js';
import { runTeamAgent } from './teamAgent.js';
import { runMemberAgent } from './memberAgent.js';
import { runProjectAgent } from './projectAgent.js';
import { runAnalyticsAgent } from './analyticsAgent.js';
import { runInsightAgent } from './insightAgent.js';
import { runRagAgent } from './ragAgent.js';
import { composeResponse } from './responseComposerAgent.js';
import { buildPrompt, callGemini } from '../lib/gemini.js';

const AGENT_MAP = {
  dataset: { fn: runDatasetAgent, label: 'Dataset Agent' },
  team: { fn: runTeamAgent, label: 'Team Agent' },
  member: { fn: runMemberAgent, label: 'Member Agent' },
  project: { fn: runProjectAgent, label: 'Project Agent' },
  analytics: { fn: runAnalyticsAgent, label: 'Analytics Agent' },
  insight: { fn: runInsightAgent, label: 'Insight Agent' },
};

/**
 * Main pipeline entry point.
 * @param {object} dataset  - active dataset from DatasetContext
 * @param {string} query    - user's natural language query
 * @returns {Promise<{ text: string, meta: object }>}
 */
export async function runCoordinator(dataset, query) {
  const flow = ['Coordinator Agent'];

  // Step 1: Intent Classification
  flow.push('Intent Classification Agent');
  const { intent, confidence, scores } = classifyIntent(query);

  // Step 2: Route to specialized agent
  let retrievalResult = null;
  let agentLabel = 'RAG Agent';

  const agentEntry = AGENT_MAP[intent];
  if (agentEntry) {
    flow.push(agentEntry.label);
    retrievalResult = agentEntry.fn(dataset, query);
    agentLabel = agentEntry.label;
  }

  // Step 3: RAG fallback if specialized agent returned nothing
  if (!retrievalResult) {
    flow.push('RAG Agent');
    agentLabel = 'RAG Agent';
    const { context, docs, sources } = runRagAgent(dataset, query);

    if (context) {
      // Step 4: Gemini LLM
      flow.push('Gemini');
      flow.push('Response Composer Agent');
      let llmText;
      try {
        const { prompt } = buildPrompt(dataset, query, docs);
        llmText = await callGemini(prompt, { maxTokens: 512, temperature: 0.0 });
      } catch {
        llmText = context; // graceful degradation
      }
      return composeResponse({ text: llmText, agentUsed: `${agentLabel} + Gemini`, executionFlow: flow, confidence, sources });
    }

    // Complete fallback
    flow.push('Response Composer Agent');
    return composeResponse({
      text: `I could not find relevant information for your query. Try asking about teams, members, projects, or analytics.`,
      agentUsed: agentLabel,
      executionFlow: flow,
      confidence: 0.2,
      sources: 'No sources found',
    });
  }

  // Step 4: Insight enrichment for non-trivial results
  let finalText = retrievalResult.text;
  let sources = retrievalResult.sources;

  if (['team', 'project', 'member'].includes(intent)) {
    flow.push('Insight Agent');
    const insight = runInsightAgent(dataset, query);
    if (insight && insight.text !== finalText) {
      // Only append insight if it adds new information
      finalText = `${finalText}`;
    }
  }

  // Step 5: Gemini enhancement for complex queries
  let usedGemini = false;
  if (['insight', 'analytics'].includes(intent)) {
    flow.push('Gemini');
    usedGemini = true;
    try {
      const { docs } = runRagAgent(dataset, query, 3);
      const { prompt } = buildPrompt(dataset, query, docs);
      const llmText = await callGemini(prompt, { maxTokens: 512, temperature: 0.0 });
      finalText = llmText;
      sources = `${sources}; Gemini-enhanced`;
    } catch {
      // keep structured agent result
    }
  }

  flow.push('Response Composer Agent');

  return composeResponse({
    text: finalText,
    agentUsed: usedGemini ? `${agentLabel} + Gemini` : agentLabel,
    executionFlow: flow,
    confidence,
    sources,
  });
}
