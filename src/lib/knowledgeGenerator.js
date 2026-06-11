/**
 * PHASE 2: KNOWLEDGE GENERATION
 * Converts dataset into structured knowledge documents
 */

export class KnowledgeGenerator {
  constructor(rawData, entities, schema) {
    this.rawData = rawData;
    this.entities = entities;
    this.schema = schema;
    this.documents = [];
    this.entityIndex = new Map();
  }

  /**
   * Generate all knowledge documents
   */
  generateDocuments() {
    this.documents = [];
    this.entityIndex.clear();

    // Generate team documents
    this.generateTeamDocuments();

    // Generate member documents
    this.generateMemberDocuments();

    // Generate project documents
    this.generateProjectDocuments();

    // Generate technology documents
    this.generateTechnologyDocuments();

    // Generate domain documents
    this.generateDomainDocuments();

    // Generate relationship documents
    this.generateRelationshipDocuments();

    return this.documents;
  }

  /**
   * Create a document with metadata
   */
  createDocument(id, type, content, metadata = {}) {
    const doc = {
      id: `${type}_${id}`,
      type,
      content,
      metadata: {
        entityId: id,
        entityType: type,
        createdAt: new Date().toISOString(),
        ...metadata,
      },
      text: content,
    };

    this.documents.push(doc);
    this.entityIndex.set(doc.id, doc);
    return doc;
  }

  /**
   * Generate team documents
   */
  generateTeamDocuments() {
    for (const team of this.entities.teams) {
      // Get team data from raw data
      const teamRows = this.rawData.filter(row => {
        const teamId = row['Team ID'] || row['team_id'];
        return teamId === team.id;
      });

      // Extract team info
      const teamData = teamRows[0] || {};
      const teamMembers = [...new Set(teamRows.map(r => r['Member ID'] || r['member_id']).filter(Boolean))];
      const projectNames = [...new Set(teamRows.map(r => r['Project Name'] || r['project_name']).filter(Boolean))];
      const techStack = [
        ...new Set(
          teamRows
            .flatMap(r => String(r['Tech Stack'] || r['tech_stack'] || '').split(','))
            .map(t => t.trim())
            .filter(Boolean)
        ),
      ];
      const domain = teamData['Domain'] || teamData['domain'] || 'Unknown';
      const status = teamData['Status'] || teamData['status'] || 'Active';

      const content = `
Team: ${team.name} (ID: ${team.id})

Overview:
- Domain: ${domain}
- Status: ${status}
- Team Size: ${teamMembers.length} members
- Active Projects: ${projectNames.length}

Members (${teamMembers.length}):
${teamMembers.map(id => `- ${id}`).join('\n')}

Projects:
${projectNames.map(p => `- ${p}`).join('\n')}

Technology Stack:
${techStack.map(t => `- ${t}`).join('\n')}

Team Analysis:
- This team operates in the ${domain} domain
- Current focus: ${projectNames.join(', ') || 'No active projects'}
- Technology alignment: ${techStack.length > 0 ? techStack.join(', ') : 'Not specified'}
      `.trim();

      this.createDocument(team.id, 'TEAM', content, {
        teamName: team.name,
        domain,
        status,
        memberCount: teamMembers.length,
        projectCount: projectNames.length,
        techCount: techStack.length,
      });
    }
  }

  /**
   * Generate member documents
   */
  generateMemberDocuments() {
    for (const member of this.entities.members) {
      // Get member data from raw data
      const memberRows = this.rawData.filter(row => {
        const memberId = row['Member ID'] || row['member_id'];
        return memberId === member.id;
      });

      const memberData = memberRows[0] || {};
      const teamId = memberData['Team ID'] || memberData['team_id'] || 'Unknown';
      const teamName = memberData['Team Name'] || memberData['team_name'] || 'Unknown Team';
      const role = memberData['Role'] || memberData['role'] || 'Team Member';
      const projectName = memberData['Project Name'] || memberData['project_name'] || 'Not assigned';
      const responsibilities = memberData['Responsibilities'] || memberData['responsibilities'] || 'Not specified';
      const skills = String(memberData['Skills'] || memberData['skills'] || '').split(',').map(s => s.trim()).filter(Boolean);

      const content = `
Member: ${member.name} (ID: ${member.id})

Profile:
- Role: ${role}
- Team: ${teamName} (${teamId})
- Current Project: ${projectName}
- Status: Active

Responsibilities:
${responsibilities || '- Not specified'}

Skills & Expertise:
${skills.length > 0 ? skills.map(s => `- ${s}`).join('\n') : '- Not specified'}

Contribution:
- Member works in the ${teamName} team
- Primary focus: ${projectName}
- Specialized roles: ${role}
      `.trim();

      this.createDocument(member.id, 'MEMBER', content, {
        memberName: member.name,
        role,
        teamId,
        teamName,
        projectName,
        skillCount: skills.length,
      });
    }
  }

  /**
   * Generate project documents
   */
  generateProjectDocuments() {
    for (const project of this.entities.projects) {
      // Get project data from raw data
      const projectRows = this.rawData.filter(row => {
        const projName = row['Project Name'] || row['project_name'];
        return projName === project.name;
      });

      const projectData = projectRows[0] || {};
      const domain = projectData['Domain'] || projectData['domain'] || 'Unknown';
      const status = projectData['Status'] || projectData['status'] || 'In Progress';
      const teamId = projectData['Team ID'] || projectData['team_id'] || 'Unknown';
      const teamName = projectData['Team Name'] || projectData['team_name'] || 'Unknown Team';
      const techStack = String(projectData['Tech Stack'] || projectData['tech_stack'] || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const description = projectData['Description'] || projectData['description'] || 'No description available';

      // Count team members working on this project
      const memberCount = projectRows.length;

      const content = `
Project: ${project.name}

Details:
- Domain: ${domain}
- Status: ${status}
- Owner Team: ${teamName} (${teamId})
- Team Members Assigned: ${memberCount}

Description:
${description}

Technology Stack (${techStack.length}):
${techStack.map(t => `- ${t}`).join('\n')}

Analysis:
- This ${domain} domain project is currently ${status.toLowerCase()}
- Led by ${teamName} with ${memberCount} team members
- Technology choices: ${techStack.join(', ') || 'Not specified'}
- Project complexity: ${techStack.length > 3 ? 'High' : techStack.length > 1 ? 'Medium' : 'Low'}
      `.trim();

      this.createDocument(project.name, 'PROJECT', content, {
        domain,
        status,
        teamId,
        teamName,
        techCount: techStack.length,
        memberCount,
      });
    }
  }

  /**
   * Generate technology documents
   */
  generateTechnologyDocuments() {
    for (const tech of this.entities.technologies) {
      // Find all projects using this tech
      const projectsUsingTech = [
        ...new Set(
          this.rawData
            .filter(row => {
              const techStr = String(row['Tech Stack'] || row['tech_stack'] || '');
              return techStr.includes(tech);
            })
            .map(r => r['Project Name'] || r['project_name'])
            .filter(Boolean)
        ),
      ];

      // Find all domains using this tech
      const domainsUsingTech = [
        ...new Set(
          this.rawData
            .filter(row => {
              const techStr = String(row['Tech Stack'] || row['tech_stack'] || '');
              return techStr.includes(tech);
            })
            .map(r => r['Domain'] || r['domain'])
            .filter(Boolean)
        ),
      ];

      const content = `
Technology: ${tech}

Adoption:
- Used in ${projectsUsingTech.length} projects
- Used in ${domainsUsingTech.length} domains

Projects Using ${tech}:
${projectsUsingTech.length > 0 ? projectsUsingTech.map(p => `- ${p}`).join('\n') : '- No projects found'}

Domains Using ${tech}:
${domainsUsingTech.length > 0 ? domainsUsingTech.map(d => `- ${d}`).join('\n') : '- No domains found'}

Technology Role:
- This technology is used across ${projectsUsingTech.length} projects
- Primary domains: ${domainsUsingTech.join(', ') || 'Not specified'}
- Adoption level: ${projectsUsingTech.length > 5 ? 'High' : projectsUsingTech.length > 2 ? 'Medium' : 'Low'}
      `.trim();

      this.createDocument(tech, 'TECHNOLOGY', content, {
        projectCount: projectsUsingTech.length,
        domainCount: domainsUsingTech.length,
      });
    }
  }

  /**
   * Generate domain documents
   */
  generateDomainDocuments() {
    for (const domain of this.entities.domains) {
      // Find all projects in this domain
      const projectsInDomain = [
        ...new Set(
          this.rawData
            .filter(row => (row['Domain'] || row['domain']) === domain)
            .map(r => r['Project Name'] || r['project_name'])
            .filter(Boolean)
        ),
      ];

      // Find all teams working in this domain
      const teamsInDomain = [
        ...new Set(
          this.rawData
            .filter(row => (row['Domain'] || row['domain']) === domain)
            .map(r => r['Team ID'] || r['team_id'])
            .filter(Boolean)
        ),
      ];

      // Find all techs used in this domain
      const techsInDomain = [
        ...new Set(
          this.rawData
            .filter(row => (row['Domain'] || row['domain']) === domain)
            .flatMap(r => String(r['Tech Stack'] || r['tech_stack'] || '').split(','))
            .map(t => t.trim())
            .filter(Boolean)
        ),
      ];

      const content = `
Domain: ${domain}

Portfolio:
- Active Projects: ${projectsInDomain.length}
- Teams Working: ${teamsInDomain.length}
- Technologies Used: ${techsInDomain.length}

Projects in ${domain}:
${projectsInDomain.length > 0 ? projectsInDomain.map(p => `- ${p}`).join('\n') : '- No projects found'}

Teams Involved:
${teamsInDomain.length > 0 ? teamsInDomain.map(t => `- ${t}`).join('\n') : '- No teams found'}

Technology Stack:
${techsInDomain.length > 0 ? techsInDomain.map(t => `- ${t}`).join('\n') : '- Not specified'}

Domain Insights:
- ${domain} domain is covered by ${teamsInDomain.length} team(s)
- ${projectsInDomain.length} projects are active in this domain
- Technology diversity: ${techsInDomain.length} different technologies
      `.trim();

      this.createDocument(domain, 'DOMAIN', content, {
        projectCount: projectsInDomain.length,
        teamCount: teamsInDomain.length,
        techCount: techsInDomain.length,
      });
    }
  }

  /**
   * Generate relationship documents
   */
  generateRelationshipDocuments() {
    const relIndex = new Map();

    for (const rel of this.entities.relationships) {
      const key = `${rel.type}_${rel.source}_${rel.target}`;

      if (relIndex.has(key)) continue;
      relIndex.set(key, true);

      let content = '';

      if (rel.type === 'member_belongs_to_team') {
        content = `Relationship: Member ${rel.source} belongs to Team ${rel.target}`;
      } else if (rel.type === 'team_owns_project') {
        content = `Relationship: Team ${rel.source} owns/manages Project ${rel.target}`;
      } else if (rel.type === 'project_belongs_to_domain') {
        content = `Relationship: Project ${rel.source} belongs to Domain ${rel.target}`;
      } else {
        content = `Relationship: ${rel.source} (${rel.type}) ${rel.target}`;
      }

      this.createDocument(key, 'RELATIONSHIP', content, {
        relationType: rel.type,
        source: rel.source,
        target: rel.target,
      });
    }
  }

  /**
   * Get documents by type
   */
  getDocumentsByType(type) {
    return this.documents.filter(doc => doc.type === type);
  }

  /**
   * Get document index for quick lookup
   */
  getEntityIndex() {
    return this.entityIndex;
  }
}

export default KnowledgeGenerator;
