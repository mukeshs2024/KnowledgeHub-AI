/**
 * PHASE 1: DATASET INTELLIGENCE LAYER
 * Handles dataset validation, schema detection, entity detection, and metadata generation
 */

import * as XLSX from 'xlsx';

export class DatasetProcessor {
  constructor(fileContent, fileName, fileType) {
    this.fileContent = fileContent;
    this.fileName = fileName;
    this.fileType = fileType;
    this.rawData = null;
    this.schema = null;
    this.entities = null;
    this.metadata = null;
  }

  /**
   * Detect file format and parse
   */
  async parseFile() {
    try {
      if (this.fileType === 'CSV' || this.fileName.endsWith('.csv')) {
        this.rawData = this.parseCSV(this.fileContent);
      } else if (this.fileType === 'XLSX' || this.fileName.endsWith('.xlsx')) {
        this.rawData = this.parseXLSX(this.fileContent);
      } else if (this.fileType === 'JSON' || this.fileName.endsWith('.json')) {
        this.rawData = JSON.parse(this.fileContent);
      } else {
        throw new Error(`Unsupported file format: ${this.fileType}`);
      }

      if (!Array.isArray(this.rawData) || this.rawData.length === 0) {
        throw new Error('Dataset must contain rows of data');
      }

      return this.rawData;
    } catch (err) {
      throw new Error(`Failed to parse file: ${err.message}`);
    }
  }

  /**
   * Parse CSV content
   */
  parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have header and at least one data row');

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      rows.push(row);
    }

    return rows;
  }

  /**
   * Parse XLSX content
   */
  parseXLSX(content) {
    const workbook = XLSX.read(content, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }

  /**
   * PHASE 1: Automatically detect schema
   */
  detectSchema() {
    if (!this.rawData || this.rawData.length === 0) {
      throw new Error('No data to analyze');
    }

    const firstRow = this.rawData[0];
    this.schema = {};

    for (const [key, value] of Object.entries(firstRow)) {
      this.schema[key] = this.inferColumnType(key, value);
    }

    return this.schema;
  }

  /**
   * Infer column type and detect special columns
   */
  inferColumnType(columnName, sampleValue) {
    const name = columnName.toLowerCase();
    const value = String(sampleValue).trim();

    // Detect IDs
    if (name.includes('id') || /^[A-Z]\d+$/.test(value)) {
      return { type: 'ID', description: `Identifier field: ${columnName}` };
    }

    // Detect names
    if (name.includes('name') || name.includes('title')) {
      return { type: 'TEXT', description: `Name field: ${columnName}` };
    }

    // Detect status
    if (name.includes('status')) {
      return { type: 'CATEGORY', description: `Status field: ${columnName}` };
    }

    // Detect domains/categories
    if (name.includes('domain') || name.includes('category') || name.includes('type')) {
      return { type: 'CATEGORY', description: `Category field: ${columnName}` };
    }

    // Detect numbers
    if (!isNaN(Number(value))) {
      return { type: 'NUMBER', description: `Numeric field: ${columnName}` };
    }

    // Detect arrays/lists (comma-separated)
    if (value.includes(',') && !value.includes('@')) {
      return { type: 'LIST', description: `List/array field: ${columnName}` };
    }

    return { type: 'TEXT', description: `Text field: ${columnName}` };
  }

  /**
   * PHASE 1: Automatically detect entities
   */
  detectEntities() {
    this.entities = {
      teams: [],
      members: [],
      projects: [],
      technologies: [],
      domains: [],
      relationships: [],
    };

    const seen = {
      teams: new Set(),
      members: new Set(),
      projects: new Set(),
      technologies: new Set(),
      domains: new Set(),
    };

    // Analyze each row
    for (const row of this.rawData) {
      // Detect teams
      if (row['Team ID'] || row['Team Name'] || row['team_id'] || row['team_name']) {
        const teamId = row['Team ID'] || row['team_id'] || `T${Math.floor(Math.random() * 10000)}`;
        const teamName = row['Team Name'] || row['team_name'] || 'Unknown Team';
        if (!seen.teams.has(teamId)) {
          this.entities.teams.push({ id: teamId, name: teamName });
          seen.teams.add(teamId);
        }
      }

      // Detect members
      if (row['Member ID'] || row['Member Name'] || row['member_id'] || row['member_name']) {
        const memberId = row['Member ID'] || row['member_id'] || `M${Math.floor(Math.random() * 10000)}`;
        const memberName = row['Member Name'] || row['member_name'] || 'Unknown Member';
        if (!seen.members.has(memberId)) {
          this.entities.members.push({ id: memberId, name: memberName });
          seen.members.add(memberId);
        }
      }

      // Detect projects
      if (row['Project Name'] || row['project_name']) {
        const projectName = row['Project Name'] || row['project_name'] || 'Unknown Project';
        if (!seen.projects.has(projectName)) {
          this.entities.projects.push({ name: projectName });
          seen.projects.add(projectName);
        }
      }

      // Detect technologies
      if (row['Tech Stack'] || row['tech_stack'] || row['Technologies']) {
        const techStr = row['Tech Stack'] || row['tech_stack'] || row['Technologies'] || '';
        const techs = String(techStr).split(',').map(t => t.trim()).filter(Boolean);
        techs.forEach(tech => {
          if (!seen.technologies.has(tech)) {
            this.entities.technologies.push(tech);
            seen.technologies.add(tech);
          }
        });
      }

      // Detect domains
      if (row['Domain'] || row['domain']) {
        const domain = row['Domain'] || row['domain'];
        if (domain && !seen.domains.has(domain)) {
          this.entities.domains.push(domain);
          seen.domains.add(domain);
        }
      }

      // Detect relationships
      const teamId = row['Team ID'] || row['team_id'];
      const memberId = row['Member ID'] || row['member_id'];
      const projectName = row['Project Name'] || row['project_name'];

      if (teamId && memberId) {
        this.entities.relationships.push({
          type: 'member_belongs_to_team',
          source: memberId,
          target: teamId,
        });
      }

      if (teamId && projectName) {
        this.entities.relationships.push({
          type: 'team_owns_project',
          source: teamId,
          target: projectName,
        });
      }

      if (projectName && row['Domain']) {
        this.entities.relationships.push({
          type: 'project_belongs_to_domain',
          source: projectName,
          target: row['Domain'],
        });
      }
    }

    return this.entities;
  }

  /**
   * PHASE 1: Generate dataset metadata
   */
  generateMetadata() {
    this.metadata = {
      fileName: this.fileName,
      fileType: this.fileType,
      uploadedAt: new Date().toISOString(),
      totalRows: this.rawData.length,
      totalColumns: Object.keys(this.rawData[0]).length,
      columns: Object.keys(this.rawData[0]),
      schema: this.schema,
      entities: {
        totalTeams: this.entities.teams.length,
        totalMembers: this.entities.members.length,
        totalProjects: this.entities.projects.length,
        totalTechnologies: this.entities.technologies.length,
        totalDomains: this.entities.domains.length,
      },
      dataQuality: this.assessDataQuality(),
    };

    return this.metadata;
  }

  /**
   * Assess data quality
   */
  assessDataQuality() {
    let completeness = 100;
    let uniqueness = 0;
    let consistency = 100;

    // Check completeness
    let emptyCount = 0;
    let uniqueCount = 0;

    for (const row of this.rawData) {
      for (const value of Object.values(row)) {
        if (!value || String(value).trim() === '') emptyCount++;
        uniqueCount++;
      }
    }

    completeness = Math.round(((uniqueCount - emptyCount) / uniqueCount) * 100);

    return {
      completeness: `${completeness}%`,
      consistency: `${consistency}%`,
      duplicates: this.findDuplicates(),
    };
  }

  /**
   * Find duplicate rows
   */
  findDuplicates() {
    const seen = new Set();
    const duplicates = [];

    for (const row of this.rawData) {
      const hash = JSON.stringify(row);
      if (seen.has(hash)) {
        duplicates.push(row);
      }
      seen.add(hash);
    }

    return duplicates.length;
  }

  /**
   * Full processing pipeline
   */
  async process() {
    await this.parseFile();
    this.detectSchema();
    this.detectEntities();
    this.generateMetadata();

    return {
      success: true,
      data: this.rawData,
      schema: this.schema,
      entities: this.entities,
      metadata: this.metadata,
    };
  }
}

export default DatasetProcessor;
