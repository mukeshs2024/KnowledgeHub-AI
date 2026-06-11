/**
 * PHASE 6: GEMINI INTEGRATION
 * Uses Gemini as reasoning engine with structured prompts
 */

const GEMINI_ENDPOINT = import.meta.env.VITE_GEMINI_ENDPOINT;
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class GeminiReasoningEngine {
  constructor() {
    this.endpoint = GEMINI_ENDPOINT;
    this.apiKey = GEMINI_KEY;
    this.maxTokens = 1024;
    this.temperature = 0.7;
  }

  /**
   * Check if Gemini is configured
   */
  isConfigured() {
    return !!(this.endpoint && this.apiKey);
  }

  /**
   * Build system prompt for agents
   */
  buildSystemPrompt(agentType) {
    const prompts = {
      TEAM: `You are a Team Intelligence Agent. You specialize in analyzing team structures, member distributions, team performance, and team recommendations. 
Provide detailed insights about teams including:
- Team composition and member roles
- Project involvement
- Technology stack expertise
- Team strengths and weaknesses
- Resource allocation suggestions

Format your response with clear sections: Overview, Members, Projects, Technologies, Recommendations.`,

      MEMBER: `You are a Member Intelligence Agent. You specialize in member profiles, roles, skills, and contributions.
Provide insights about members including:
- Role and responsibilities
- Skills and expertise
- Team participation
- Project contributions
- Career development suggestions

Format your response with clear sections: Profile, Role, Skills, Contributions, Development.`,

      PROJECT: `You are a Project Intelligence Agent. You specialize in project analysis, technology evaluation, and project success factors.
Provide insights about projects including:
- Project scope and objectives
- Technology stack appropriateness
- Team allocation
- Risk assessment
- Delivery recommendations

Format your response with clear sections: Overview, Scope, Technologies, Team, Risks, Recommendations.`,

      INSIGHT: `You are an Insight Generation Agent. You specialize in generating business intelligence, trends, and strategic recommendations.
Provide comprehensive insights including:
- Dataset overview and key metrics
- Trends and patterns
- Risk identification
- Opportunity assessment
- Strategic recommendations

Format your response with clear sections: Overview, Metrics, Trends, Risks, Opportunities, Recommendations.`,

      RAG: `You are a Knowledge Retrieval Agent. You specialize in finding and synthesizing relevant information.
Provide accurate, well-sourced responses using the provided context.
Always cite sources and indicate confidence levels.
Format your response with clear sections: Summary, Details, Sources, Confidence.`,
    };

    return prompts[agentType] || prompts.RAG;
  }

  /**
   * Build context string from retrieved documents
   */
  buildContextString(documents, maxLength = 2000) {
    let context = 'CONTEXT FROM KNOWLEDGE BASE:\n\n';

    for (const doc of documents) {
      if ((context + doc.text).length > maxLength) break;
      context += `[${doc.documentId} - ${doc.documentType}]\n${doc.text}\n\n`;
    }

    return context;
  }

  /**
   * Build structured prompt for Team Agent
   */
  buildTeamPrompt(query, context) {
    return `${this.buildSystemPrompt('TEAM')}

${context.combinedText}

USER QUERY: ${query}

Based on the provided context, answer the user's query comprehensively. Include specific team IDs, member counts, project details, and technology information where available.`;
  }

  /**
   * Build structured prompt for Member Agent
   */
  buildMemberPrompt(query, context) {
    return `${this.buildSystemPrompt('MEMBER')}

${context.combinedText}

USER QUERY: ${query}

Based on the provided context, analyze the member profile, skills, and contributions. Provide specific details about roles, projects, and team involvement.`;
  }

  /**
   * Build structured prompt for Project Agent
   */
  buildProjectPrompt(query, context) {
    return `${this.buildSystemPrompt('PROJECT')}

${context.combinedText}

USER QUERY: ${query}

Based on the provided context, analyze the project in detail including scope, technology stack, team allocation, and recommendations.`;
  }

  /**
   * Build structured prompt for Insight Agent
   */
  buildInsightPrompt(query, context, statistics = {}) {
    return `${this.buildSystemPrompt('INSIGHT')}

DATASET STATISTICS:
${JSON.stringify(statistics, null, 2)}

${context.combinedText}

USER QUERY: ${query}

Generate comprehensive business intelligence and strategic recommendations based on the dataset analysis.`;
  }

  /**
   * Build structured prompt for RAG Agent
   */
  buildRAGPrompt(query, context) {
    return `${this.buildSystemPrompt('RAG')}

${context.combinedText}

USER QUERY: ${query}

Answer the user's query using the provided context. Be specific, cite sources, and indicate your confidence in the answer.`;
  }

  /**
   * Call Gemini API with structured prompt
   */
  async callGemini(prompt, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Gemini not configured. Set VITE_GEMINI_ENDPOINT and VITE_GEMINI_API_KEY.');
    }

    const body = {
      prompt,
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || this.temperature,
      top_p: 0.95,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    };

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini API error: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.text || data.text || '';
    } catch (err) {
      throw new Error(`Gemini call failed: ${err.message}`);
    }
  }

  /**
   * Reason about query with agent-specific prompt
   */
  async reason(agentType, query, context, statistics = {}) {
    let prompt = '';

    switch (agentType) {
      case 'TEAM':
        prompt = this.buildTeamPrompt(query, context);
        break;
      case 'MEMBER':
        prompt = this.buildMemberPrompt(query, context);
        break;
      case 'PROJECT':
        prompt = this.buildProjectPrompt(query, context);
        break;
      case 'INSIGHT':
        prompt = this.buildInsightPrompt(query, context, statistics);
        break;
      default:
        prompt = this.buildRAGPrompt(query, context);
    }

    try {
      const reasoning = await this.callGemini(prompt);
      return {
        success: true,
        reasoning,
        agent: agentType,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        agent: agentType,
        fallback: true,
      };
    }
  }

  /**
   * Generate structured response with reasoning
   */
  async generateResponse(agentType, query, retrievedDocs, statistics = {}) {
    const context = this.buildContextForAgent(retrievedDocs);

    const reasoningResult = await this.reason(agentType, query, context, statistics);

    if (!reasoningResult.success) {
      // Fallback response
      return {
        answer: retrievedDocs.length > 0 ? retrievedDocs[0].text : 'No information available',
        agent: agentType,
        reasoning: 'Using retrieval without LLM enhancement',
        confidence: 0.6,
        sources: retrievedDocs.map(d => d.documentId),
        usedGemini: false,
      };
    }

    return {
      answer: reasoningResult.reasoning,
      agent: agentType,
      reasoning: 'Generated with Gemini reasoning engine',
      confidence: 0.9,
      sources: retrievedDocs.map(d => d.documentId),
      usedGemini: true,
    };
  }

  /**
   * Build context for different agents
   */
  buildContextForAgent(documents) {
    return {
      combinedText: documents.map(d => `[${d.documentId}] ${d.text}`).join('\n\n'),
      documents,
      count: documents.length,
    };
  }

  /**
   * Extract entities from reasoning
   */
  extractEntitiesFromReasoning(reasoning) {
    const entities = {
      teamIds: [],
      memberIds: [],
      projectNames: [],
      technologies: [],
      domains: [],
    };

    // Extract team IDs
    const teamMatches = reasoning.match(/\bT\d+\b/g) || [];
    entities.teamIds = [...new Set(teamMatches)];

    // Extract member IDs
    const memberMatches = reasoning.match(/\bM\d+\b/g) || [];
    entities.memberIds = [...new Set(memberMatches)];

    // Extract quoted project names
    const projectMatches = reasoning.match(/"([^"]+)"/g) || [];
    entities.projectNames = projectMatches.map(p => p.replace(/"/g, ''));

    return entities;
  }
}

export default GeminiReasoningEngine;
