/**
 * PHASE 7 & 8: AGENT EXECUTION METADATA & RESPONSE FORMATTING
 * Formats responses with execution metadata, reasoning, and source tracking
 */

export class ResponseFormatter {
  /**
   * Format agent response with metadata
   */
  static formatAgentResponse(baseResponse, retrievedDocs = [], agentType = 'RAG') {
    return {
      // Core response
      answer: baseResponse.answer || '',
      query: baseResponse.query || '',

      // Agent information
      agentUsed: baseResponse.agentUsed || agentType,
      agentType: baseResponse.type || agentType,
      confidence: Math.round((baseResponse.confidence || 0.5) * 100),
      confidencePercentage: `${Math.round((baseResponse.confidence || 0.5) * 100)}%`,

      // Reasoning
      reasoning: baseResponse.reasoning || 'Semantic matching and retrieval',
      coordinatorReasoning: baseResponse.coordinatorReasoning || '',

      // Workflow
      workflow: baseResponse.workflow || [
        'User Query',
        'Coordinator Agent',
        `${agentType} Agent`,
        'Knowledge Retrieval',
        'Response Generation',
      ],

      // Sources and citations
      sources: this.formatSources(retrievedDocs, baseResponse.sources),
      sourceCount: retrievedDocs.length,
      citations: this.generateCitations(retrievedDocs),

      // Metadata
      metadata: {
        timestamp: new Date().toISOString(),
        responseTime: baseResponse.responseTime || 'unknown',
        usedGemini: baseResponse.usedGemini || false,
        retrievedDocuments: retrievedDocs.length,
        geminiAvailable: baseResponse.geminiAvailable || false,
      },

      // Status
      status: 'SUCCESS',
      error: null,
    };
  }

  /**
   * Format error response
   */
  static formatErrorResponse(error, query = '') {
    return {
      error: error.message || String(error),
      query,
      answer: `Unable to process query: ${error.message}`,
      agentUsed: 'Error Handler',
      confidence: 0,
      confidencePercentage: '0%',
      workflow: ['User Query', 'Error Handler'],
      sources: [],
      sourceCount: 0,
      citations: [],
      metadata: {
        timestamp: new Date().toISOString(),
        status: 'ERROR',
      },
      status: 'ERROR',
    };
  }

  /**
   * Format sources for display
   */
  static formatSources(docs, additionalSources = []) {
    const sources = [];
    const seen = new Set();

    // From retrieved documents
    for (const doc of docs) {
      const sourceId = doc.documentId || doc.id;
      if (!seen.has(sourceId)) {
        sources.push({
          id: sourceId,
          type: doc.documentType || 'Document',
          name: doc.metadata?.entityId || sourceId,
          relevance: doc.similarity || 0,
        });
        seen.add(sourceId);
      }
    }

    // Additional sources
    if (Array.isArray(additionalSources)) {
      for (const source of additionalSources) {
        if (!seen.has(source)) {
          sources.push({
            id: source,
            type: 'Reference',
            name: source,
          });
          seen.add(source);
        }
      }
    }

    return sources;
  }

  /**
   * Generate formal citations
   */
  static generateCitations(docs) {
    return docs.map((doc, index) => ({
      id: index + 1,
      source: doc.documentId || doc.id,
      type: doc.documentType || 'Document',
      relevance: `${(doc.similarity || 0).toFixed(1)}%`,
      entity: doc.metadata?.entityId || 'N/A',
    }));
  }

  /**
   * Format dashboard summary
   */
  static formatDashboardSummary(summary) {
    return {
      title: 'Dataset Intelligence Summary',
      metadata: {
        fileName: summary.fileName,
        uploadedAt: summary.uploadedAt,
        analysisTime: new Date().toLocaleString(),
      },

      datasetOverview: {
        title: 'Dataset Overview',
        metrics: [
          { label: 'Total Rows', value: summary.datasetSummary.totalRows.toLocaleString() },
          { label: 'Total Columns', value: summary.datasetSummary.totalColumns },
          { label: 'Teams', value: summary.datasetSummary.totalTeams },
          { label: 'Members', value: summary.datasetSummary.totalMembers },
          { label: 'Projects', value: summary.datasetSummary.totalProjects },
          { label: 'Domains', value: summary.datasetSummary.totalDomains },
          { label: 'Technologies', value: summary.datasetSummary.totalTechnologies },
        ],
      },

      aiInsights: {
        title: 'AI-Generated Insights',
        insights: [
          { label: 'Most Active Team', value: summary.aiInsights.mostActiveTeam },
          { label: 'Most Used Technology', value: summary.aiInsights.mostUsedTechnology },
          { label: 'Team Distribution', value: summary.aiInsights.teamDistribution },
          { label: 'Project Distribution', value: summary.aiInsights.projectDistribution },
          { label: 'Completion Rate', value: `${summary.aiInsights.completionPercentage}%` },
        ],
      },

      executiveSummary: {
        title: 'Executive Summary',
        content: summary.executiveSummary,
      },

      systemStatus: {
        title: 'System Status',
        ready: summary.systemStatus.isReady,
        geminiAvailable: summary.systemStatus.geminiAvailable,
        documentsIndexed: summary.systemStatus.documentsIndexed,
        graphNodes: summary.systemStatus.graphNodes,
        graphEdges: summary.systemStatus.graphEdges,
      },
    };
  }

  /**
   * Format detailed analysis response
   */
  static formatAnalysisResponse(agentResponse, analysisType = 'GENERAL') {
    const types = {
      TEAM: 'Team Analysis',
      MEMBER: 'Member Profile & Analysis',
      PROJECT: 'Project Analysis',
      DOMAIN: 'Domain Analysis',
      TECHNOLOGY: 'Technology Impact Analysis',
      INSIGHT: 'Business Intelligence Report',
      GENERAL: 'Knowledge Base Query',
    };

    return {
      analysisType: types[analysisType] || types.GENERAL,
      response: agentResponse.answer,
      confidence: `${Math.round((agentResponse.confidence || 0.5) * 100)}%`,
      agent: agentResponse.agent,
      reasoning: agentResponse.reasoning,
      sources: agentResponse.sources,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate markdown report
   */
  static generateMarkdownReport(response) {
    const report = `
# Intelligence Report

**Timestamp:** ${response.metadata.timestamp}
**Agent:** ${response.agentUsed}
**Confidence:** ${response.confidencePercentage}

## Query
${response.query}

## Response
${response.answer}

## Reasoning
${response.reasoning}

## Workflow
${response.workflow.map(step => `- ${step}`).join('\n')}

## Sources
${response.citations.map(cite => `[${cite.id}] ${cite.source} (${cite.type}) - Relevance: ${cite.relevance}`).join('\n')}

## Metadata
- Response Time: ${response.metadata.responseTime}
- Retrieved Documents: ${response.sourceCount}
- Gemini Used: ${response.metadata.usedGemini ? 'Yes' : 'No'}
`;

    return report.trim();
  }

  /**
   * Format insights batch response
   */
  static formatInsightsBatch(insights) {
    return {
      reportType: 'Comprehensive Intelligence Report',
      generatedAt: new Date().toISOString(),

      summary: {
        title: 'Executive Summary',
        content: insights.summary,
      },

      businessInsights: {
        title: 'Business Intelligence',
        content: insights.businessInsights,
      },

      recommendations: {
        title: 'Strategic Recommendations',
        content: insights.recommendations,
      },

      readinessLevel: this.determineReadinessLevel(insights),
    };
  }

  /**
   * Determine system readiness level
   */
  static determineReadinessLevel(insights) {
    const indicators = {
      excellent: 'System fully operational with comprehensive insights',
      good: 'System operational with good insights',
      fair: 'System operational with limited insights',
      limited: 'System partially operational',
    };

    // This would be based on actual metrics
    return {
      level: 'excellent',
      description: indicators.excellent,
      metrics: {
        dataQuality: 'High',
        analysisDepth: 'Comprehensive',
        geminiIntegration: 'Active',
      },
    };
  }
}

export default ResponseFormatter;
