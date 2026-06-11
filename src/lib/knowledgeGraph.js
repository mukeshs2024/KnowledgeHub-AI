/**
 * PHASE 3: KNOWLEDGE GRAPH
 * Builds and manages relationships between entities
 */

export class KnowledgeGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.adjacencyList = new Map();
  }

  /**
   * Create a node in the graph
   */
  addNode(id, type, data = {}) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        type,
        data,
        createdAt: new Date().toISOString(),
      });

      if (!this.adjacencyList.has(id)) {
        this.adjacencyList.set(id, []);
      }
    }
    return this.nodes.get(id);
  }

  /**
   * Create an edge (relationship) in the graph
   */
  addEdge(sourceId, targetId, relationshipType, metadata = {}) {
    const edgeId = `${sourceId}_${relationshipType}_${targetId}`;

    const edge = {
      id: edgeId,
      source: sourceId,
      target: targetId,
      type: relationshipType,
      metadata,
      createdAt: new Date().toISOString(),
    };

    this.edges.push(edge);

    // Update adjacency list
    if (!this.adjacencyList.has(sourceId)) {
      this.adjacencyList.set(sourceId, []);
    }
    this.adjacencyList.get(sourceId).push({ node: targetId, type: relationshipType });

    return edge;
  }

  /**
   * Build graph from entities and documents
   */
  buildFromEntities(entities, rawData) {
    // Add nodes for all teams
    for (const team of entities.teams) {
      this.addNode(team.id, 'TEAM', { name: team.name });
    }

    // Add nodes for all members
    for (const member of entities.members) {
      this.addNode(member.id, 'MEMBER', { name: member.name });
    }

    // Add nodes for all projects
    for (const project of entities.projects) {
      this.addNode(project.name, 'PROJECT', { name: project.name });
    }

    // Add nodes for all technologies
    for (const tech of entities.technologies) {
      this.addNode(tech, 'TECHNOLOGY', { name: tech });
    }

    // Add nodes for all domains
    for (const domain of entities.domains) {
      this.addNode(domain, 'DOMAIN', { name: domain });
    }

    // Build relationships from raw data
    const processedEdges = new Set();

    for (const row of rawData) {
      const teamId = row['Team ID'] || row['team_id'];
      const memberId = row['Member ID'] || row['member_id'];
      const projectName = row['Project Name'] || row['project_name'];
      const techStack = String(row['Tech Stack'] || row['tech_stack'] || '').split(',').map(t => t.trim()).filter(Boolean);
      const domain = row['Domain'] || row['domain'];

      // Member belongs to Team
      if (memberId && teamId) {
        const edgeKey = `member_belongs_to_team_${memberId}_${teamId}`;
        if (!processedEdges.has(edgeKey)) {
          this.addEdge(memberId, teamId, 'BELONGS_TO_TEAM', {
            confidence: 1.0,
            direct: true,
          });
          processedEdges.add(edgeKey);
        }
      }

      // Team owns Project
      if (teamId && projectName) {
        const edgeKey = `team_owns_project_${teamId}_${projectName}`;
        if (!processedEdges.has(edgeKey)) {
          this.addEdge(teamId, projectName, 'OWNS_PROJECT', {
            confidence: 1.0,
            direct: true,
          });
          processedEdges.add(edgeKey);
        }
      }

      // Member works on Project
      if (memberId && projectName) {
        const edgeKey = `member_works_on_${memberId}_${projectName}`;
        if (!processedEdges.has(edgeKey)) {
          this.addEdge(memberId, projectName, 'WORKS_ON_PROJECT', {
            confidence: 0.95,
            derived: false,
          });
          processedEdges.add(edgeKey);
        }
      }

      // Project uses Technology
      for (const tech of techStack) {
        const edgeKey = `project_uses_tech_${projectName}_${tech}`;
        if (!processedEdges.has(edgeKey)) {
          this.addEdge(projectName, tech, 'USES_TECHNOLOGY', {
            confidence: 1.0,
            direct: true,
          });
          processedEdges.add(edgeKey);
        }
      }

      // Project belongs to Domain
      if (projectName && domain) {
        const edgeKey = `project_in_domain_${projectName}_${domain}`;
        if (!processedEdges.has(edgeKey)) {
          this.addEdge(projectName, domain, 'BELONGS_TO_DOMAIN', {
            confidence: 1.0,
            direct: true,
          });
          processedEdges.add(edgeKey);
        }
      }

      // Team works in Domain
      if (teamId && domain) {
        const edgeKey = `team_works_in_domain_${teamId}_${domain}`;
        if (!processedEdges.has(edgeKey)) {
          this.addEdge(teamId, domain, 'WORKS_IN_DOMAIN', {
            confidence: 0.9,
            derived: true,
          });
          processedEdges.add(edgeKey);
        }
      }
    }

    return this;
  }

  /**
   * Get all neighbors of a node
   */
  getNeighbors(nodeId, relationshipType = null) {
    const neighbors = [];
    const edges = this.adjacencyList.get(nodeId) || [];

    for (const edge of edges) {
      if (!relationshipType || edge.type === relationshipType) {
        const nodeData = this.nodes.get(edge.node);
        neighbors.push({
          node: nodeData,
          relationship: edge.type,
        });
      }
    }

    return neighbors;
  }

  /**
   * Find paths between two nodes
   */
  findPath(sourceId, targetId, maxDepth = 5) {
    const queue = [[sourceId]];
    const visited = new Set([sourceId]);

    while (queue.length > 0) {
      const path = queue.shift();

      if (path.length > maxDepth) continue;

      const currentId = path[path.length - 1];

      if (currentId === targetId) {
        return path;
      }

      const neighbors = this.adjacencyList.get(currentId) || [];
      for (const { node } of neighbors) {
        if (!visited.has(node)) {
          visited.add(node);
          queue.push([...path, node]);
        }
      }
    }

    return null;
  }

  /**
   * Get all nodes of a specific type
   */
  getNodesByType(type) {
    const nodes = [];
    for (const [, node] of this.nodes) {
      if (node.type === type) {
        nodes.push(node);
      }
    }
    return nodes;
  }

  /**
   * Get all edges of a specific type
   */
  getEdgesByType(type) {
    return this.edges.filter(edge => edge.type === type);
  }

  /**
   * Analyze node importance (degree centrality)
   */
  analyzeNodeImportance(nodeId) {
    const outgoing = this.adjacencyList.get(nodeId)?.length || 0;
    const incoming = this.edges.filter(e => e.target === nodeId).length;
    const totalDegree = outgoing + incoming;

    return {
      nodeId,
      outgoingConnections: outgoing,
      incomingConnections: incoming,
      totalDegree,
      importance: totalDegree / (this.nodes.size - 1),
    };
  }

  /**
   * Get top influential nodes
   */
  getInfluentialNodes(limit = 10) {
    const importances = [];

    for (const [nodeId] of this.nodes) {
      importances.push(this.analyzeNodeImportance(nodeId));
    }

    return importances
      .sort((a, b) => b.totalDegree - a.totalDegree)
      .slice(0, limit);
  }

  /**
   * Analyze team structure
   */
  analyzeTeamStructure(teamId) {
    const team = this.nodes.get(teamId);
    if (!team || team.type !== 'TEAM') {
      return null;
    }

    const members = this.getNeighbors(teamId, 'BELONGS_TO_TEAM');
    const projects = this.getNeighbors(teamId, 'OWNS_PROJECT');
    const domains = this.getNeighbors(teamId, 'WORKS_IN_DOMAIN');

    return {
      teamId,
      teamName: team.data.name,
      memberCount: members.length,
      members: members.map(m => m.node),
      projectCount: projects.length,
      projects: projects.map(p => p.node),
      domainCount: domains.length,
      domains: domains.map(d => d.node),
      complexity: Math.sqrt(members.length * projects.length),
    };
  }

  /**
   * Analyze project scope
   */
  analyzeProjectScope(projectId) {
    const project = this.nodes.get(projectId);
    if (!project || project.type !== 'PROJECT') {
      return null;
    }

    const team = this.edges.filter(e => e.target === projectId && e.type === 'OWNS_PROJECT').map(e => this.nodes.get(e.source))[0];
    const technologies = this.getNeighbors(projectId, 'USES_TECHNOLOGY');
    const domain = this.getNeighbors(projectId, 'BELONGS_TO_DOMAIN');
    const members = this.edges.filter(e => e.target === projectId && e.type === 'WORKS_ON_PROJECT').map(e => this.nodes.get(e.source));

    return {
      projectId,
      projectName: project.data.name,
      owningTeam: team?.data.name || 'Unknown',
      memberCount: members.length,
      members,
      technologies: technologies.map(t => t.node.data.name),
      technologyCount: technologies.length,
      domain: domain.length > 0 ? domain[0].node.data.name : 'Unknown',
      complexity: technologies.length + members.length,
    };
  }

  /**
   * Export graph as JSON
   */
  toJSON() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      nodeCount: this.nodes.size,
      edgeCount: this.edges.length,
    };
  }

  /**
   * Get graph statistics
   */
  getStatistics() {
    const nodesByType = {};
    const edgesByType = {};

    for (const [, node] of this.nodes) {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    }

    for (const edge of this.edges) {
      edgesByType[edge.type] = (edgesByType[edge.type] || 0) + 1;
    }

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      nodesByType,
      edgesByType,
      averageDegree: this.edges.length / this.nodes.size,
    };
  }
}

export default KnowledgeGraph;
