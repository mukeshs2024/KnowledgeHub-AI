/**
 * PHASE 5: MULTI-AGENT ARCHITECTURE
 * Specialized agents for different query types
 */

export class BaseAgent {
  constructor(name, type, ragRetriever, knowledgeGraph) {
    this.name = name;
    this.type = type;
    this.ragRetriever = ragRetriever;
    this.knowledgeGraph = knowledgeGraph;
  }

  /**
   * Base method to process query
   */
  async process(query, context = {}) {
    throw new Error('process() must be implemented');
  }

  /**
   * Build response object
   */
  buildResponse(answer, confidence = 0.8, sources = []) {
    return {
      answer,
      agent: this.name,
      type: this.type,
      confidence,
      sources,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * COORDINATOR AGENT
 * Routes queries to appropriate specialized agents
 */
export class CoordinatorAgent {
  constructor(agents) {
    this.agents = agents; // Map of agent type -> agent instance
    this.queryHistory = [];
  }

  /**
   * Detect query intent
   */
  detectIntent(query) {
    const lower = query.toLowerCase();

    // Team-related queries
    if (lower.includes('team') || lower.includes('t0') || /\bT\d+\b/.test(query)) {
      return { intent: 'TEAM', confidence: 0.95 };
    }

    // Member-related queries
    if (lower.includes('member') || lower.includes('m0') || /\bM\d+\b/.test(query)) {
      return { intent: 'MEMBER', confidence: 0.95 };
    }

    // Project-related queries
    if (lower.includes('project') || lower.includes('technology') || lower.includes('tech stack')) {
      return { intent: 'PROJECT', confidence: 0.9 };
    }

    // Insight queries
    if (
      lower.includes('insight') ||
      lower.includes('analysis') ||
      lower.includes('summary') ||
      lower.includes('trend') ||
      lower.includes('pattern') ||
      lower.includes('recommendation')
    ) {
      return { intent: 'INSIGHT', confidence: 0.85 };
    }

    // Domain-related queries
    if (
      lower.includes('domain') ||
      lower.includes('industry') ||
      lower.includes('sector')
    ) {
      return { intent: 'PROJECT', confidence: 0.8 }; // Route to project agent for domain info
    }

    // Fallback to RAG
    return { intent: 'RAG', confidence: 0.5 };
  }

  /**
   * Route query to appropriate agent
   */
  async route(query) {
    const intent = this.detectIntent(query);

    const agentType = this.mapIntentToAgent(intent.intent);
    const agent = this.agents.get(agentType);

    if (!agent) {
      return {
        error: `No agent found for intent: ${intent.intent}`,
        agentUsed: 'COORDINATOR',
        routing: intent,
      };
    }

    return {
      routing: intent,
      agentType,
      agent,
    };
  }

  /**
   * Map intent to agent
   */
  mapIntentToAgent(intent) {
    const mapping = {
      TEAM: 'TEAM',
      MEMBER: 'MEMBER',
      PROJECT: 'PROJECT',
      INSIGHT: 'INSIGHT',
      RAG: 'RAG',
    };
    return mapping[intent] || 'RAG';
  }

  /**
   * Coordinate and execute
   */
  async coordinate(query) {
    const routing = await this.route(query);

    if (routing.error) {
      return {
        error: routing.error,
        coordinatorReasoning: 'Failed to route query',
        workflow: ['User Query', 'Coordinator Agent', 'Error'],
      };
    }

    const agent = routing.agent;
    const agentType = routing.agentType;

    try {
      const result = await agent.process(query, {
        routing: routing.routing,
        coordinatorDecision: true,
      });

      return {
        ...result,
        coordinatorReasoning: `Query routed to ${agentType} agent (intent: ${routing.routing.intent}, confidence: ${routing.routing.confidence})`,
        workflow: [
          'User Query',
          'Coordinator Agent',
          `${agentType} Agent`,
          'Knowledge Retrieval',
          'Response Generation',
        ],
        agentUsed: agentType,
      };
    } catch (err) {
      return {
        error: err.message,
        agentUsed: agentType,
        coordinatorReasoning: `${agentType} agent failed: ${err.message}`,
      };
    }
  }
}

/**
 * TEAM AGENT
 * Handles team-related queries
 */
export class TeamAgent extends BaseAgent {
  constructor(ragRetriever, knowledgeGraph) {
    super('Team Agent', 'TEAM', ragRetriever, knowledgeGraph);
  }

  async process(query, context = {}) {
    // Extract team ID if present
    const teamIdMatch = query.match(/\bT\d+\b/i);
    const teamId = teamIdMatch ? teamIdMatch[0].toUpperCase() : null;

    let sources = [];
    let answer = '';

    if (teamId) {
      // Exact team lookup
      const teamAnalysis = this.knowledgeGraph.analyzeTeamStructure(teamId);

      if (teamAnalysis) {
        sources = [`Team ${teamAnalysis.teamName}`];
        answer = `${teamAnalysis.teamName} (${teamId}) has ${teamAnalysis.memberCount} members working on ${teamAnalysis.projectCount} project(s). Domains: ${teamAnalysis.domains.map(d => d.data.name).join(', ') || 'Not specified'}. Complexity score: ${teamAnalysis.complexity.toFixed(2)}.`;
      }
    }

    if (!answer) {
      // Semantic search for team info
      const searchResult = this.ragRetriever.search(query, { documentType: 'TEAM', topK: 3 });
      sources = searchResult.citations.map(c => c.entityId);
      answer = searchResult.results.length > 0
        ? `Found ${searchResult.results.length} team(s) matching your query. ${searchResult.results[0].text}`
        : 'No team information found';
    }

    return this.buildResponse(answer, 0.92, sources);
  }
}

/**
 * MEMBER AGENT
 * Handles member-related queries
 */
export class MemberAgent extends BaseAgent {
  constructor(ragRetriever, knowledgeGraph) {
    super('Member Agent', 'MEMBER', ragRetriever, knowledgeGraph);
  }

  async process(query, context = {}) {
    // Extract member ID if present
    const memberIdMatch = query.match(/\bM\d+\b/i);
    const memberId = memberIdMatch ? memberIdMatch[0].toUpperCase() : null;

    let sources = [];
    let answer = '';

    if (memberId) {
      // Exact member lookup
      const member = this.knowledgeGraph.nodes.get(memberId);

      if (member) {
        const neighbors = this.knowledgeGraph.getNeighbors(memberId);
        sources = [member.data.name];
        answer = `${member.data.name} (${memberId}) has ${neighbors.length} connections in the knowledge graph. Related teams and projects available.`;
      }
    }

    if (!answer) {
      // Semantic search for member info
      const searchResult = this.ragRetriever.search(query, { documentType: 'MEMBER', topK: 3 });
      sources = searchResult.citations.map(c => c.entityId);
      answer = searchResult.results.length > 0
        ? `Found ${searchResult.results.length} member(s). ${searchResult.results[0].text}`
        : 'No member information found';
    }

    return this.buildResponse(answer, 0.9, sources);
  }
}

/**
 * PROJECT AGENT
 * Handles project-related queries
 */
export class ProjectAgent extends BaseAgent {
  constructor(ragRetriever, knowledgeGraph) {
    super('Project Agent', 'PROJECT', ragRetriever, knowledgeGraph);
  }

  async process(query, context = {}) {
    const searchResult = this.ragRetriever.search(query, {
      documentType: 'PROJECT',
      topK: 5,
    });

    let answer = '';
    let sources = [];

    if (searchResult.results.length > 0) {
      sources = searchResult.results.map(r => r.metadata?.entityId).filter(Boolean);

      const projects = searchResult.results;
      if (projects.length === 1) {
        answer = projects[0].text;
      } else {
        answer = `Found ${projects.length} project(s): ${projects.map(p => p.metadata?.entityId || 'Unknown').join(', ')}. `;
        answer += projects[0].text;
      }
    } else {
      answer = 'No projects found matching your query.';
    }

    return this.buildResponse(answer, searchResult.results.length > 0 ? 0.88 : 0.5, sources);
  }
}

/**
 * INSIGHT AGENT
 * Generates AI intelligence and business insights
 */
export class InsightAgent extends BaseAgent {
  constructor(ragRetriever, knowledgeGraph, rawData = []) {
    super('Insight Agent', 'INSIGHT', ragRetriever, knowledgeGraph);
    this.rawData = rawData;
  }

  async process(query, context = {}) {
    const insights = this.generateInsights();

    let answer = `Dataset Analysis Report:\n\n${insights.summary}\n\nBusiness Insights:\n${insights.businessInsights}\n\nRecommendations:\n${insights.recommendations}`;

    return this.buildResponse(answer, 0.85, ['Dataset Analysis']);
  }

  /**
   * Generate dataset insights
   */
  generateInsights() {
    const stats = this.knowledgeGraph.getStatistics();
    const graph = this.knowledgeGraph;

    // Dataset Summary
    const teamCount = graph.getNodesByType('TEAM').length;
    const memberCount = graph.getNodesByType('MEMBER').length;
    const projectCount = graph.getNodesByType('PROJECT').length;
    const techCount = graph.getNodesByType('TECHNOLOGY').length;
    const domainCount = graph.getNodesByType('DOMAIN').length;

    // Most active teams
    const teamImportances = graph
      .getInfluentialNodes()
      .filter(n => {
        const node = graph.nodes.get(n.nodeId);
        return node && node.type === 'TEAM';
      })
      .slice(0, 3);

    // Most used technologies
    const techImportances = graph
      .getInfluentialNodes()
      .filter(n => {
        const node = graph.nodes.get(n.nodeId);
        return node && node.type === 'TECHNOLOGY';
      })
      .slice(0, 3);

    // Most active domains
    const domainImportances = graph
      .getInfluentialNodes()
      .filter(n => {
        const node = graph.nodes.get(n.nodeId);
        return node && node.type === 'DOMAIN';
      })
      .slice(0, 3);

    const summary = `
Total Entities:
- Teams: ${teamCount}
- Members: ${memberCount}
- Projects: ${projectCount}
- Technologies: ${techCount}
- Domains: ${domainCount}

Graph Metrics:
- Total Relationships: ${stats.totalEdges}
- Average Connections per Entity: ${(stats.averageDegree || 0).toFixed(2)}
    `.trim();

    const businessInsights = `
Most Active Teams:
${teamImportances.map((t, i) => `${i + 1}. ${graph.nodes.get(t.nodeId)?.data.name || 'Unknown'} (${t.totalDegree} connections)`).join('\n')}

Most Used Technologies:
${techImportances.map((t, i) => `${i + 1}. ${graph.nodes.get(t.nodeId)?.data.name || 'Unknown'} (${t.totalDegree} projects)`).join('\n')}

Dominant Domains:
${domainImportances.map((d, i) => `${i + 1}. ${graph.nodes.get(d.nodeId)?.data.name || 'Unknown'} (${d.totalDegree} projects)`).join('\n')}
    `.trim();

    const avgTeamSize = memberCount / teamCount || 0;
    const avgProjectsPerTeam = projectCount / teamCount || 0;
    const techDiversity = (techCount / projectCount * 100).toFixed(1);

    const recommendations = `
1. Team Allocation: Average team size is ${avgTeamSize.toFixed(1)} members with ${avgProjectsPerTeam.toFixed(1)} projects per team.
2. Technology Stack: ${techDiversity}% technology diversity suggests ${techDiversity > 30 ? 'good' : 'limited'} tech flexibility.
3. Capacity Planning: ${teamImportances[0] ? `${graph.nodes.get(teamImportances[0].nodeId)?.data.name || 'Top team'} appears overloaded. Consider resource rebalancing.` : 'Teams are well-balanced.'}
4. Domain Coverage: ${domainCount} domains covered with varying team focus.
5. Skill Development: Ensure cross-functional skill sharing across ${domainCount} domains.
    `.trim();

    return { summary, businessInsights, recommendations };
  }
}

/**
 * RAG AGENT
 * Fallback semantic search agent
 */
export class RAGAgent extends BaseAgent {
  constructor(ragRetriever, knowledgeGraph) {
    super('RAG Agent', 'RAG', ragRetriever, knowledgeGraph);
  }

  async process(query, context = {}) {
    const searchResult = this.ragRetriever.search(query, { topK: 5, minSimilarity: 10 });

    const answer =
      searchResult.results.length > 0
        ? `Based on knowledge base search: ${searchResult.results[0].text} (Relevance: ${searchResult.results[0].similarity.toFixed(1)}%)`
        : 'I could not find relevant information in the knowledge base. Please rephrase your query.';

    return this.buildResponse(answer, Math.min(searchResult.avgSimilarity / 100, 0.95), searchResult.citations.map(c => c.documentId));
  }
}

export default {
  BaseAgent,
  CoordinatorAgent,
  TeamAgent,
  MemberAgent,
  ProjectAgent,
  InsightAgent,
  RAGAgent,
};
