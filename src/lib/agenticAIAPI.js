/**
 * PHASE 8: API LAYER WITH METADATA
 * Exposes Agentic AI System endpoints with response metadata
 */

import { agenticAISystem } from './agenticAISystem.js';

export class AgenticAIAPI {
  /**
   * Query endpoint
   */
  static async query(userQuery) {
    return agenticAISystem.query(userQuery);
  }

  /**
   * Process and upload dataset
   */
  static async uploadDataset(fileContent, fileName, fileType = 'CSV') {
    return agenticAISystem.processDataset(fileContent, fileName, fileType);
  }

  /**
   * Get dashboard summary
   */
  static getDashboardSummary() {
    return agenticAISystem.getDashboardSummary();
  }

  /**
   * Get system status
   */
  static getSystemStatus() {
    return agenticAISystem.getSystemStatus();
  }

  /**
   * Get insights report
   */
  static async getInsightsReport() {
    const response = await agenticAISystem.query('Generate comprehensive business intelligence report and strategic recommendations');
    return {
      report: response.answer,
      agent: response.agentUsed,
      confidence: response.confidence,
      sources: response.sources,
      timestamp: response.timestamp,
    };
  }

  /**
   * Team analysis
   */
  static async analyzeTeam(teamId) {
    const response = await agenticAISystem.query(`Provide detailed analysis of ${teamId}`);
    return response;
  }

  /**
   * Member analysis
   */
  static async analyzeMember(memberId) {
    const response = await agenticAISystem.query(`Provide detailed profile and analysis of ${memberId}`);
    return response;
  }

  /**
   * Project analysis
   */
  static async analyzeProject(projectName) {
    const response = await agenticAISystem.query(`Provide detailed analysis of project ${projectName}`);
    return response;
  }

  /**
   * Technology impact analysis
   */
  static async analyzeTechnology(technology) {
    const response = await agenticAISystem.query(`Analyze adoption and usage of ${technology} technology`);
    return response;
  }

  /**
   * Domain analysis
   */
  static async analyzeDomain(domain) {
    const response = await agenticAISystem.query(`Provide comprehensive analysis of ${domain} domain`);
    return response;
  }

  /**
   * Reset system
   */
  static reset() {
    agenticAISystem.reset();
    return { status: 'RESET', message: 'Agentic AI System has been reset' };
  }

  /**
   * Get all teams
   */
  static getTeams() {
    const teams = agenticAISystem.state.knowledgeGraph?.getNodesByType('TEAM') || [];
    return teams.map(t => ({
      id: t.id,
      name: t.data.name,
      analysis: agenticAISystem.state.knowledgeGraph?.analyzeTeamStructure(t.id),
    }));
  }

  /**
   * Get all members
   */
  static getMembers() {
    const members = agenticAISystem.state.knowledgeGraph?.getNodesByType('MEMBER') || [];
    return members.map(m => ({
      id: m.id,
      name: m.data.name,
      neighbors: agenticAISystem.state.knowledgeGraph?.getNeighbors(m.id),
    }));
  }

  /**
   * Get all projects
   */
  static getProjects() {
    const projects = agenticAISystem.state.knowledgeGraph?.getNodesByType('PROJECT') || [];
    return projects.map(p => ({
      name: p.data.name,
      analysis: agenticAISystem.state.knowledgeGraph?.analyzeProjectScope(p.id),
    }));
  }

  /**
   * Get influential nodes
   */
  static getInfluentialNodes(limit = 10) {
    return agenticAISystem.state.knowledgeGraph?.getInfluentialNodes(limit) || [];
  }

  /**
   * Get graph statistics
   */
  static getGraphStatistics() {
    return agenticAISystem.state.knowledgeGraph?.getStatistics() || {};
  }

  /**
   * Search documents
   */
  static search(query, options = {}) {
    return agenticAISystem.state.ragRetriever?.search(query, options) || { results: [], citations: [] };
  }
}

export default AgenticAIAPI;
