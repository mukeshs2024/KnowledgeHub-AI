/**
 * AGENTIC AI SYSTEM - MAIN ORCHESTRATION
 * Combines all phases into one unified system
 */

import DatasetProcessor from './datasetProcessor.js';
import KnowledgeGenerator from './knowledgeGenerator.js';
import KnowledgeGraph from './knowledgeGraph.js';
import { DocumentChunker, RAGRetriever } from './ragRetriever.js';
import {
  CoordinatorAgent,
  TeamAgent,
  MemberAgent,
  ProjectAgent,
  InsightAgent,
  RAGAgent,
} from './agents.js';
import GeminiReasoningEngine from './geminiReasoning.js';

export class AgenticAISystem {
  constructor() {
    this.state = {
      datasetProcessor: null,
      rawData: null,
      schema: null,
      entities: null,
      metadata: null,

      knowledgeGenerator: null,
      documents: [],
      entityIndex: null,

      knowledgeGraph: null,

      ragRetriever: null,
      documentChunks: [],
      embeddings: [],

      agents: new Map(),
      coordinatorAgent: null,
      geminiEngine: null,

      isReady: false,
      status: 'INITIALIZED',
    };

    this.initializeGemini();
  }

  /**
   * Initialize Gemini
   */
  initializeGemini() {
    this.state.geminiEngine = new GeminiReasoningEngine();
    if (this.state.geminiEngine.isConfigured()) {
      console.log('Gemini configured and ready');
    } else {
      console.warn('Gemini not configured - fallback mode enabled');
    }
  }

  /**
   * COMPLETE PIPELINE: Process dataset
   */
  async processDataset(fileContent, fileName, fileType = 'CSV') {
    this.state.status = 'PROCESSING_DATASET';

    try {
      // PHASE 1: Dataset Intelligence
      console.log('PHASE 1: Dataset Intelligence...');
      const processor = new DatasetProcessor(fileContent, fileName, fileType);
      const result = await processor.process();

      this.state.datasetProcessor = processor;
      this.state.rawData = result.data;
      this.state.schema = result.schema;
      this.state.entities = result.entities;
      this.state.metadata = result.metadata;

      console.log(`✓ Processed ${result.data.length} rows with ${Object.keys(result.schema).length} columns`);
      console.log(`✓ Detected ${result.entities.teams.length} teams, ${result.entities.members.length} members, ${result.entities.projects.length} projects`);

      // PHASE 2: Knowledge Generation
      console.log('PHASE 2: Knowledge Generation...');
      const knowledgeGen = new KnowledgeGenerator(result.data, result.entities, result.schema);
      const documents = knowledgeGen.generateDocuments();

      this.state.knowledgeGenerator = knowledgeGen;
      this.state.documents = documents;
      this.state.entityIndex = knowledgeGen.getEntityIndex();

      console.log(`✓ Generated ${documents.length} knowledge documents`);

      // PHASE 3: Knowledge Graph
      console.log('PHASE 3: Knowledge Graph...');
      const graph = new KnowledgeGraph();
      graph.buildFromEntities(result.entities, result.data);

      this.state.knowledgeGraph = graph;
      const graphStats = graph.getStatistics();
      console.log(`✓ Built knowledge graph with ${graphStats.totalNodes} nodes and ${graphStats.totalEdges} edges`);

      // PHASE 4: Embedding & RAG
      console.log('PHASE 4: Embedding & RAG Layer...');
      const retriever = new RAGRetriever();
      retriever.indexDocuments(documents);

      this.state.ragRetriever = retriever;
      const ragStats = retriever.getStatistics();
      console.log(`✓ Indexed ${ragStats.totalChunks} chunks from ${ragStats.totalDocuments} documents`);

      // PHASE 5 & 6: Agents & Gemini
      console.log('PHASE 5 & 6: Agent Architecture & Gemini Integration...');
      this.initializeAgents();

      this.state.status = 'READY';
      this.state.isReady = true;
      console.log('✓ Agentic AI System ready!');

      return {
        success: true,
        status: 'READY',
        metadata: result.metadata,
        graphStats,
        ragStats,
      };
    } catch (err) {
      this.state.status = 'ERROR';
      this.state.isReady = false;
      throw err;
    }
  }

  /**
   * Initialize all agents
   */
  initializeAgents() {
    // Create specialized agents
    const teamAgent = new TeamAgent(this.state.ragRetriever, this.state.knowledgeGraph);
    const memberAgent = new MemberAgent(this.state.ragRetriever, this.state.knowledgeGraph);
    const projectAgent = new ProjectAgent(this.state.ragRetriever, this.state.knowledgeGraph);
    const insightAgent = new InsightAgent(this.state.ragRetriever, this.state.knowledgeGraph, this.state.rawData);
    const ragAgent = new RAGAgent(this.state.ragRetriever, this.state.knowledgeGraph);

    // Register agents
    this.state.agents.set('TEAM', teamAgent);
    this.state.agents.set('MEMBER', memberAgent);
    this.state.agents.set('PROJECT', projectAgent);
    this.state.agents.set('INSIGHT', insightAgent);
    this.state.agents.set('RAG', ragAgent);

    // Create coordinator
    this.state.coordinatorAgent = new CoordinatorAgent(this.state.agents);

    console.log('✓ Initialized Coordinator Agent and 5 specialized agents');
  }

  /**
   * MAIN QUERY ENDPOINT
   */
  async query(userQuery) {
    if (!this.state.isReady) {
      return {
        error: 'System not ready. Please upload a dataset first.',
        status: this.state.status,
      };
    }

    try {
      // Route through coordinator
      const coordination = await this.state.coordinatorAgent.coordinate(userQuery);

      if (coordination.error) {
        return coordination;
      }

      const agentType = coordination.agentUsed || 'RAG';

      // Retrieve relevant documents
      let retrievedDocs = [];
      if (agentType === 'INSIGHT') {
        // Get all documents for insight generation
        retrievedDocs = this.state.documents.slice(0, 20);
      } else {
        // Semantic search
        const searchResult = this.state.ragRetriever.search(userQuery, { topK: 5, minSimilarity: 0 });
        retrievedDocs = searchResult.results;
      }

      // Enhance with Gemini if available
      let enhancedResponse = coordination;

      if (this.state.geminiEngine?.isConfigured()) {
        try {
          const graphStats = this.state.knowledgeGraph.getStatistics();
          const geminiResponse = await this.state.geminiEngine.generateResponse(
            agentType,
            userQuery,
            retrievedDocs,
            graphStats
          );

          enhancedResponse = {
            ...enhancedResponse,
            answer: geminiResponse.answer,
            reasoning: geminiResponse.reasoning,
            confidence: geminiResponse.confidence,
            usedGemini: true,
          };
        } catch (err) {
          console.warn('Gemini enhancement failed, using base response:', err.message);
        }
      }

      // Add metadata
      return {
        ...enhancedResponse,
        query: userQuery,
        timestamp: new Date().toISOString(),
        sources: retrievedDocs.map(d => ({
          id: d.documentId,
          type: d.documentType,
          similarity: d.similarity,
        })),
        metadata: {
          retrievedDocuments: retrievedDocs.length,
          systemReady: true,
          geminiAvailable: this.state.geminiEngine?.isConfigured(),
        },
      };
    } catch (err) {
      return {
        error: `Query failed: ${err.message}`,
        status: 'ERROR',
        query: userQuery,
      };
    }
  }

  /**
   * Get dataset summary for dashboard
   */
  getDashboardSummary() {
    if (!this.state.isReady) {
      return null;
    }

    const graphStats = this.state.knowledgeGraph.getStatistics();
    const topTeams = this.state.knowledgeGraph.getInfluentialNodes(3);
    const topTechs = this.state.knowledgeGraph
      .getInfluentialNodes()
      .filter(n => {
        const node = this.state.knowledgeGraph.nodes.get(n.nodeId);
        return node && node.type === 'TECHNOLOGY';
      })
      .slice(0, 3);

    const teamNodes = this.state.knowledgeGraph.getNodesByType('TEAM');
    const projectNodes = this.state.knowledgeGraph.getNodesByType('PROJECT');
    const domainNodes = this.state.knowledgeGraph.getNodesByType('DOMAIN');

    // Calculate completion percentage from status nodes
    const completedProjects = this.state.rawData.filter(
      r => (r['Status'] || r['status'] || '').toLowerCase() === 'completed'
    ).length;
    const totalProjects = this.state.rawData.length;
    const completionPercentage = Math.round((completedProjects / totalProjects) * 100);

    return {
      fileName: this.state.metadata.fileName,
      uploadedAt: this.state.metadata.uploadedAt,

      datasetSummary: {
        totalRows: this.state.metadata.totalRows,
        totalColumns: this.state.metadata.totalColumns,
        totalTeams: graphStats.nodesByType.TEAM || 0,
        totalMembers: graphStats.nodesByType.MEMBER || 0,
        totalProjects: graphStats.nodesByType.PROJECT || 0,
        totalDomains: graphStats.nodesByType.DOMAIN || 0,
        totalTechnologies: graphStats.nodesByType.TECHNOLOGY || 0,
      },

      aiInsights: {
        mostActiveTeam: topTeams.length > 0 ? this.state.knowledgeGraph.nodes.get(topTeams[0].nodeId)?.data.name : 'N/A',
        mostUsedTechnology: topTechs.length > 0 ? this.state.knowledgeGraph.nodes.get(topTechs[0].nodeId)?.data.name : 'N/A',
        teamDistribution: teamNodes.length,
        projectDistribution: projectNodes.length,
        completionPercentage,
      },

      executiveSummary: `The uploaded dataset contains ${graphStats.nodesByType.TEAM || 0} teams, ${graphStats.nodesByType.MEMBER || 0} members, and ${graphStats.nodesByType.PROJECT || 0} projects. ` +
        `${domainNodes.length} domains are active. The most frequently used technology is ${topTechs.length > 0 ? this.state.knowledgeGraph.nodes.get(topTechs[0].nodeId)?.data.name : 'N/A'}. ` +
        `Overall project completion rate is ${completionPercentage}%.`,

      systemStatus: {
        isReady: this.state.isReady,
        geminiAvailable: this.state.geminiEngine?.isConfigured(),
        documentsIndexed: this.state.documents.length,
        graphNodes: graphStats.totalNodes,
        graphEdges: graphStats.totalEdges,
      },
    };
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      status: this.state.status,
      isReady: this.state.isReady,
      components: {
        datasetProcessor: !!this.state.datasetProcessor,
        knowledgeGenerator: !!this.state.knowledgeGenerator,
        knowledgeGraph: !!this.state.knowledgeGraph,
        ragRetriever: !!this.state.ragRetriever,
        agents: this.state.agents.size,
        gemini: this.state.geminiEngine?.isConfigured(),
      },
      data: {
        documentsGenerated: this.state.documents.length,
        graphNodes: this.state.knowledgeGraph?.nodes.size || 0,
        graphEdges: this.state.knowledgeGraph?.edges.length || 0,
      },
    };
  }

  /**
   * Reset system
   */
  reset() {
    this.state = {
      datasetProcessor: null,
      rawData: null,
      schema: null,
      entities: null,
      metadata: null,
      knowledgeGenerator: null,
      documents: [],
      entityIndex: null,
      knowledgeGraph: null,
      ragRetriever: null,
      documentChunks: [],
      embeddings: [],
      agents: new Map(),
      coordinatorAgent: null,
      geminiEngine: this.state.geminiEngine,
      isReady: false,
      status: 'INITIALIZED',
    };
  }
}

// Export singleton instance
export const agenticAISystem = new AgenticAISystem();

export default AgenticAISystem;
