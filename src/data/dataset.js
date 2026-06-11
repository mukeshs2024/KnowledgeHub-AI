import * as XLSX from 'xlsx';

const EMPTY_VALUES = new Set(['', 'null', 'undefined', 'nan', 'n/a', 'na']);

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && quoted && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && nextChar === '\n') index += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }

  const [headers = [], ...records] = rows;
  return records.map((record) =>
    headers.reduce((entry, header, index) => {
      entry[header || `Column ${index + 1}`] = record[index] ?? '';
      return entry;
    }, {})
  );
}

function flattenObject(value, prefix = '') {
  if (Array.isArray(value)) {
    return { [prefix || 'value']: value.map((item) => stringifyValue(item)).join(', ') };
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((flat, [key, nestedValue]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
        return { ...flat, ...flattenObject(nestedValue, path) };
      }
      flat[path] = Array.isArray(nestedValue) ? nestedValue.map((item) => stringifyValue(item)).join(', ') : nestedValue;
      return flat;
    }, {});
  }

  return { [prefix || 'value']: value };
}

function findJsonRecords(json) {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== 'object') return [{ value: json }];

  const arrayEntry = Object.entries(json).find(([, value]) => Array.isArray(value));
  if (arrayEntry) return arrayEntry[1];

  return [json];
}

function cleanRows(rows) {
  return rows.map((row) => flattenObject(row)).filter((row) => Object.values(row).some((value) => !isEmpty(value)));
}

function isEmpty(value) {
  return value === null || value === undefined || EMPTY_VALUES.has(String(value).trim().toLowerCase());
}

function stringifyValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value).replace(/[$,%]/g, '').replace(/,/g, '').trim();
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function isDateLike(value) {
  if (value instanceof Date) return true;
  const text = String(value).trim();
  if (!text || /^\d+(\.\d+)?$/.test(text)) return false;
  const time = Date.parse(text);
  return Number.isFinite(time);
}

function inferType(values) {
  const present = values.filter((value) => !isEmpty(value));
  if (!present.length) return 'empty';

  const numericCount = present.filter((value) => toNumber(value) !== null).length;
  const dateCount = present.filter(isDateLike).length;
  const booleanCount = present.filter((value) => ['true', 'false', 'yes', 'no'].includes(String(value).toLowerCase())).length;

  if (numericCount / present.length >= 0.85) return 'number';
  if (dateCount / present.length >= 0.75) return 'date';
  if (booleanCount / present.length >= 0.85) return 'boolean';
  return 'text';
}

function prettifyName(name) {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function pluralize(name) {
  const clean = prettifyName(name);
  if (!clean) return 'Records';
  if (clean.endsWith('s')) return clean;
  if (clean.endsWith('y')) return `${clean.slice(0, -1)}ies`;
  return `${clean}s`;
}

function inferDatasetType(fileName, fields) {
  const source = `${fileName} ${fields.join(' ')}`.toLowerCase();
  const signals = [
    ['employee', ['employee', 'salary', 'department', 'designation']],
    ['student', ['student', 'course', 'marks', 'grade']],
    ['sales', ['sales', 'revenue', 'product', 'customer', 'order']],
    ['inventory', ['inventory', 'stock', 'sku', 'warehouse', 'quantity']],
    ['customer', ['customer', 'city', 'segment', 'account']],
    ['project', ['project', 'team', 'status', 'member']],
  ];

  const match = signals
    .map(([label, words]) => ({ label, score: words.filter((word) => source.includes(word)).length }))
    .sort((a, b) => b.score - a.score)[0];

  if (match?.score > 0) return `${prettifyName(match.label)} Dataset`;
  const baseName = fileName.replace(/\.[^.]+$/, '').replace(/\d+/g, '');
  return `${prettifyName(baseName) || 'Universal'} Dataset`;
}

function inferEntities(columns) {
  const idColumns = columns.filter((column) => /(^id$|id$|_id$|name$|type$|category$|department$|course$|city$|status$)/i.test(column.name));
  const entities = idColumns.slice(0, 5).map((column) => pluralize(column.name.replace(/id$/i, '')));
  return [...new Set(entities)].filter(Boolean).slice(0, 5);
}

function buildPossibleQuestions(columns, datasetType) {
  const numeric = columns.filter((column) => column.type === 'number');
  const categorical = columns.filter((column) => column.type === 'text' && column.uniqueCount <= Math.max(20, column.presentCount * 0.6));
  const nameColumn = columns.find((column) => /name/i.test(column.name));
  const questions = [];

  if (categorical[0]) questions.push(`Show records where ${prettifyName(categorical[0].name)} is ${categorical[0].sampleValues[0] ?? 'a value'}.`);
  if (numeric[0]) questions.push(`What is the average ${prettifyName(numeric[0].name)}?`);
  if (numeric[0]) questions.push(`Show the highest ${prettifyName(numeric[0].name)} record.`);
  if (nameColumn) questions.push(`Find ${prettifyName(nameColumn.name)} details.`);
  questions.push(`How many records are in this ${datasetType.toLowerCase()}?`);

  return questions.slice(0, 5);
}

export function generateDocuments(rows) {
  return rows.map((row, index) => {
    const get = (candidates) => {
      for (const key of Object.keys(row)) {
        const low = key.toLowerCase();
        if (candidates.some((cand) => low.includes(cand))) return stringifyValue(row[key]);
      }
      return '';
    };

    const team = get(['team', 'teamname', 'team_name', 'group', 'squad', 'department']);
    const project = get(['project', 'projectname', 'project_name', 'initiative', 'program', 'task', 'name']);
    const domain = get(['domain', 'sector', 'industry']);
    const status = get(['status', 'projectstatus', 'project_status']);
    const member = get(['member', 'membername', 'member_name', 'employee', 'username', 'developer', 'person']);
    const role = get(['role', 'position', 'job']);
    const responsibilities = get(['responsibilities', 'responsibility', 'tasks']);
    const tech = get(['techstack', 'tech_stack', 'technology', 'tech']);
    const problem = get(['problem', 'problemstatement', 'problem_statement']);
    const solution = get(['solution', 'solutiondescription', 'approach']);

    const text = [
      team ? `Team: ${team}` : '',
      project ? `Project: ${project}` : '',
      domain ? `Domain: ${domain}` : '',
      status ? `Status: ${status}` : '',
      member ? `Member: ${member}` : '',
      role ? `Role: ${role}` : '',
      responsibilities ? `Responsibilities: ${responsibilities}` : '',
      tech ? `Tech Stack: ${tech}` : '',
      problem ? `Problem: ${problem}` : '',
      solution ? `Solution: ${solution}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const metadata = {
      fileRow: index + 1,
      team,
      project,
      domain,
      status,
      member,
      role,
    };

    return {
      id: `doc_${index + 1}`,
      text: text || Object.entries(row).map(([k, v]) => `${prettifyName(k)}: ${stringifyValue(v)}`).join('\n'),
      metadata,
      row,
    };
  });
}

export function generateAnalytics(rows, columns) {
  const analytics = [
    { label: 'Rows', value: rows.length.toLocaleString(), detail: 'Records loaded from the active dataset', kind: 'summary' },
    { label: 'Columns', value: columns.length.toLocaleString(), detail: 'Fields detected in the schema', kind: 'summary' },
  ];

  columns.forEach((column) => {
    const values = rows.map((row) => row[column.name]).filter((value) => !isEmpty(value));

    if (column.type === 'number') {
      const numbers = values.map(toNumber).filter((value) => value !== null);
      if (!numbers.length) return;
      const total = numbers.reduce((sum, value) => sum + value, 0);
      analytics.push({
        label: prettifyName(column.name),
        value: (total / numbers.length).toLocaleString(undefined, { maximumFractionDigits: 2 }),
        detail: `Average. Min ${Math.min(...numbers).toLocaleString()}, max ${Math.max(...numbers).toLocaleString()}`,
        kind: 'numeric',
      });
    } else if (column.type === 'date') {
      const years = values.reduce((counts, value) => {
        const year = new Date(value).getFullYear();
        if (Number.isFinite(year)) counts[year] = (counts[year] ?? 0) + 1;
        return counts;
      }, {});
      const topYear = Object.entries(years).sort((a, b) => b[1] - a[1])[0];
      analytics.push({
        label: `${prettifyName(column.name)} Trend`,
        value: topYear?.[0] ?? 'N/A',
        detail: topYear ? `${topYear[1]} records in the busiest year` : 'No date trend available',
        kind: 'date',
      });
    } else if (column.uniqueCount > 1 && column.uniqueCount <= 20) {
      const top = Object.entries(column.frequencies).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
      analytics.push({
        label: prettifyName(column.name),
        value: top?.[0] ?? 'N/A',
        detail: `Most frequent value${top ? `, ${top[1]} records` : ''}`,
        kind: 'categorical',
      });
    }
  });

  return analytics.slice(0, 12);
}

export function dataset_analysis_agent({ rows, fileName, fileType }) {
  const fieldNames = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const columns = fieldNames.map((name) => {
    const values = rows.map((row) => row[name]);
    const presentValues = values.filter((value) => !isEmpty(value)).map(stringifyValue);
    const frequencies = presentValues.reduce((counts, value) => {
      counts[value] = (counts[value] ?? 0) + 1;
      return counts;
    }, {});

    return {
      name,
      label: prettifyName(name),
      type: inferType(values),
      missingCount: rows.length - presentValues.length,
      presentCount: presentValues.length,
      uniqueCount: Object.keys(frequencies).length,
      sampleValues: [...new Set(presentValues)].slice(0, 4),
      frequencies,
    };
  });

  const datasetType = inferDatasetType(fileName, fieldNames);
  const entities = inferEntities(columns);
  const documents = generateDocuments(rows);
  const analytics = generateAnalytics(rows, columns);

  return {
    fileName,
    fileType,
    rows,
    columns,
    documents,
    analytics,
    metadata: {
      datasetType,
      datasetCategory: datasetType,
      entities: entities.length ? entities : ['Records'],
      possibleQuestions: buildPossibleQuestions(columns, datasetType),
      rowCount: rows.length,
      columnCount: columns.length,
      vectorStore: 'ChromaDB-ready document objects generated in-browser',
      agents: ['Coordinator Agent', 'Dataset Analysis Agent', 'Schema Detection Agent', 'Document Generation Agent', 'Retrieval Agent', 'Gemini Response Agent'],
    },
    summary: `File Type: ${fileType}\nRows: ${rows.length}\nColumns: ${columns.length}\nDetected Fields:\n${fieldNames.map((field) => `- ${prettifyName(field)}`).join('\n')}`,
  };
}

export async function parseUploadedFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const text = await file.text();
    return {
      ...dataset_analysis_agent({ rows: cleanRows(parseCsv(text)), fileName: file.name, fileType: 'CSV' }),
      uploadedAt: new Date().toISOString(),
      status: 'Ready for Analysis',
    };
  }

  if (extension === 'json') {
    const text = await file.text();
    const json = JSON.parse(text);
    return {
      ...dataset_analysis_agent({ rows: cleanRows(findJsonRecords(json)), fileName: file.name, fileType: 'JSON' }),
      uploadedAt: new Date().toISOString(),
      status: 'Ready for Analysis',
    };
  }

  if (extension === 'xlsx') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return {
      ...dataset_analysis_agent({ rows: cleanRows(rows), fileName: file.name, fileType: 'Excel' }),
      uploadedAt: new Date().toISOString(),
      status: 'Ready for Analysis',
    };
  }

  throw new Error('Unsupported file type. Upload a CSV, XLSX, or JSON file.');
}

function tokenize(text) {
  return String(text).toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function findBestColumn(columns, query, type) {
  const tokens = tokenize(query);
  return columns
    .filter((column) => !type || column.type === type)
    .map((column) => {
      const nameTokens = tokenize(column.name);
      const score = nameTokens.filter((token) => tokens.includes(token)).length + (tokens.some((token) => column.name.toLowerCase().includes(token)) ? 1 : 0);
      return { column, score };
    })
    .sort((a, b) => b.score - a.score || b.column.presentCount - a.column.presentCount)[0]?.column;
}

function formatRow(row, columns) {
  return columns
    .slice(0, 8)
    .filter((column) => !isEmpty(row[column.name]))
    .map((column) => `${column.label}: ${stringifyValue(row[column.name])}`)
    .join(', ');
}

function retrieveDocuments(dataset, query, limit = 5) {
  const queryTokens = tokenize(query).filter((token) => token.length > 1);
  return dataset.documents
    .map((document) => {
      const text = `${document.text} ${Object.values(document.metadata).join(' ')}`.toLowerCase();
      const score = queryTokens.reduce((total, token) => total + (text.includes(token) ? 2 : 0), 0);
      return { ...document, score };
    })
    .filter((document) => document.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function normalizeDatasetValue(value) {
  return String(value ?? '').trim().toUpperCase();
}

export function findExactRowMatches(dataset, question) {
  const teamIdMatch = question.match(/team\s*id\s*(?:is|=|:)?\s*(t0*\d+)/i);
  if (teamIdMatch) {
    const teamId = teamIdMatch[1].toUpperCase();
    return dataset.rows.filter((row) => normalizeDatasetValue(row.TeamID || row.teamId || row.TeamId) === teamId);
  }

  const memberIdMatch = question.match(/member\s*id\s*(?:is|=|:)?\s*(m0*\d+)/i);
  if (memberIdMatch) {
    const memberId = memberIdMatch[1].toUpperCase();
    return dataset.rows.filter((row) => normalizeDatasetValue(row.MemberID || row.memberId || row.MemberId) === memberId);
  }

  return [];
}

export function answerQuestion(dataset, question) {
  const normalized = question.toLowerCase();
  const numericColumn = findBestColumn(dataset.columns, question, 'number') ?? dataset.columns.find((column) => column.type === 'number');
  const exactRowMatches = findExactRowMatches(dataset, question);

  if (exactRowMatches.length) {
    return {
      text: `I found ${exactRowMatches.length} relevant record${exactRowMatches.length > 1 ? 's' : ''}:
${exactRowMatches.map((row, index) => `${index + 1}. ${formatRow(row, dataset.columns)}`).join('\n')}`,
      agent: 'Gemini Response Agent',
      sources: `Retrieved ${exactRowMatches.length} records`,
      confidence: 'High',
    };
  }

  // Answer questions about specific team
  if (/team|teams/i.test(question)) {
    const { teams, members, projects } = deriveDatasetEntities(dataset);
    
    // List all teams
    if (/all teams|list teams|show teams|how many teams/i.test(question)) {
      return {
        text: `There are ${teams.length} teams: ${teams.map(t => `${t.name} (${t.memberCount} members)`).join(', ')}.`,
        agent: 'Gemini Response Agent',
        sources: 'Teams data',
        confidence: 'High',
      };
    }
    
    // Find specific team
    const teamMatch = teams.find(t => normalized.includes(t.name.toLowerCase()));
    if (teamMatch) {
      const teamMembers = members.filter(m => m.teamId === teamMatch.id);
      const teamProjects = projects.filter(p => p.teamId === teamMatch.id);
      return {
        text: `Team "${teamMatch.name}" has ${teamMembers.length} members: ${teamMembers.map(m => m.name).join(', ')}. Working on: ${teamProjects.map(p => p.name).join(', ')}.`,
        agent: 'Gemini Response Agent',
        sources: 'Teams, Members, Projects',
        confidence: 'High',
      };
    }
  }

  // Answer questions about members
  if (/member|people|person|staff|employee/i.test(question)) {
    const { members, projects } = deriveDatasetEntities(dataset);
    
    // List all members
    if (/all members|list members|show members|how many members/i.test(question)) {
      return {
        text: `There are ${members.length} members total: ${members.map(m => `${m.name} (${m.role})`).join(', ')}.`,
        agent: 'Gemini Response Agent',
        sources: 'Members data',
        confidence: 'High',
      };
    }
    
    // Find specific member
    const memberMatch = members.find(m => normalized.includes(m.name.toLowerCase()));
    if (memberMatch) {
      return {
        text: `${memberMatch.name} is a ${memberMatch.role} in team "${memberMatch.teamName}". Project: ${memberMatch.projectName || 'Unknown'}. Responsibilities: ${memberMatch.responsibilities || 'Not specified'}.`,
        agent: 'Gemini Response Agent',
        sources: 'Members data',
        confidence: 'High',
      };
    }
  }

  // Answer questions about projects
  if (/project|projects|solution|problem/i.test(question)) {
    const { projects, members, teams } = deriveDatasetEntities(dataset);
    
    // List all projects
    if (/all projects|list projects|show projects|how many projects/i.test(question)) {
      return {
        text: `There are ${projects.length} projects: ${projects.map(p => `${p.name} (Status: ${p.status}, Domain: ${p.domain})`).join('; ')}.`,
        agent: 'Gemini Response Agent',
        sources: 'Projects data',
        confidence: 'High',
      };
    }
    
    // Find specific project
    const projectMatch = projects.find(p => normalized.includes(p.name.toLowerCase()));
    if (projectMatch) {
      return {
        text: `Project "${projectMatch.name}" (${projectMatch.domain}, Status: ${projectMatch.status}). Problem: ${projectMatch.problemStatement || 'Not specified'}. Solution: ${projectMatch.solution || 'Not specified'}. Tech: ${projectMatch.techStack.join(', ') || 'Not specified'}.`,
        agent: 'Gemini Response Agent',
        sources: 'Projects data',
        confidence: 'High',
      };
    }
  }

  // Answer questions about technology/tech stack
  if (/tech|technology|stack|language|framework|tool|programming/i.test(question)) {
    const { projects } = deriveDatasetEntities(dataset);
    const allTechs = new Set();
    projects.forEach(p => p.techStack.forEach(t => allTechs.add(t)));
    if (allTechs.size > 0) {
      return {
        text: `Technologies used: ${Array.from(allTechs).join(', ')}.`,
        agent: 'Gemini Response Agent',
        sources: 'Projects tech stack',
        confidence: 'High',
      };
    }
  }

  // Answer questions about status
  if (/status|progress|complete|ongoing|pending|state/i.test(question)) {
    const { projects } = deriveDatasetEntities(dataset);
    const statusGroups = {};
    projects.forEach(p => {
      if (!statusGroups[p.status]) statusGroups[p.status] = [];
      statusGroups[p.status].push(p.name);
    });
    const statusSummary = Object.entries(statusGroups).map(([status, names]) => `${status}: ${names.join(', ')}`).join('; ');
    return {
      text: `Project statuses: ${statusSummary}.`,
      agent: 'Gemini Response Agent',
      sources: 'Projects status',
      confidence: 'High',
    };
  }

  // Answer questions about count/total records
  if (/how many|count|total records|number of|total/i.test(question)) {
    return {
      text: `The active ${dataset.metadata.datasetType.toLowerCase()} has ${dataset.rows.length.toLocaleString()} records and ${dataset.columns.length.toLocaleString()} detected fields.`,
      agent: 'Gemini Response Agent',
      sources: 'Dataset metadata',
      confidence: 'High',
    };
  }

  if (numericColumn && /average|avg|mean/i.test(normalized)) {
    const numbers = dataset.rows.map((row) => toNumber(row[numericColumn.name])).filter((value) => value !== null);
    const average = numbers.reduce((sum, value) => sum + value, 0) / Math.max(numbers.length, 1);
    return {
      text: `Average ${numericColumn.label} is ${average.toLocaleString(undefined, { maximumFractionDigits: 2 })} across ${numbers.length} records.`,
      agent: 'Gemini Response Agent',
      sources: `Numeric values in ${numericColumn.label}`,
      confidence: 'High',
    };
  }

  if (numericColumn && /highest|max|maximum|top|largest|most/i.test(normalized)) {
    const ranked = dataset.rows
      .map((row) => ({ row, value: toNumber(row[numericColumn.name]) }))
      .filter((item) => item.value !== null)
      .sort((a, b) => b.value - a.value)
      .slice(0, normalized.includes('top 5') ? 5 : 1);
    return ranked.length
      ? {
          text: `Highest ${numericColumn.label}: ${ranked.map((item) => `${item.value.toLocaleString()} (${formatRow(item.row, dataset.columns)})`).join('\n')}`,
          agent: 'Gemini Response Agent',
          sources: `Top ${numericColumn.label} records`,
          confidence: 'High',
        }
      : {
          text: `I could not find numeric values for ${numericColumn.label}.`,
          agent: 'Gemini Response Agent',
          sources: 'Dataset records',
          confidence: 'Low',
        };
  }

  if (numericColumn && /lowest|min|minimum|smallest|least/i.test(normalized)) {
    const ranked = dataset.rows
      .map((row) => ({ row, value: toNumber(row[numericColumn.name]) }))
      .filter((item) => item.value !== null)
      .sort((a, b) => a.value - b.value)
      .slice(0, 1);
    return ranked.length
      ? {
          text: `Lowest ${numericColumn.label}: ${ranked[0].value.toLocaleString()} (${formatRow(ranked[0].row, dataset.columns)})`,
          agent: 'Gemini Response Agent',
          sources: `Lowest ${numericColumn.label} record`,
          confidence: 'High',
        }
      : {
          text: `I could not find numeric values for ${numericColumn.label}.`,
          agent: 'Gemini Response Agent',
          sources: 'Dataset records',
          confidence: 'Low',
        };
  }

  const matches = retrieveDocuments(dataset, question);
  if (matches.length) {
    return {
      text: `I found ${matches.length} relevant record${matches.length > 1 ? 's' : ''}:\n${matches.map((match, index) => `${index + 1}. ${formatRow(match.row, dataset.columns)}`).join('\n')}`,
      agent: 'Gemini Response Agent',
      sources: `Retrieved ${matches.length} records`,
      confidence: 'High',
    };
  }

  return {
    text: `I could not find an exact match in this dataset. Try asking about one of these fields: ${dataset.columns.slice(0, 8).map((column) => column.label).join(', ')}.`,
    agent: 'Gemini Response Agent',
    sources: 'No sources found',
    confidence: 'Low',
  };
}
export function deriveDatasetEntities(dataset) {
  if (!dataset?.rows) {
    return { members: [], projects: [], teams: [] };
  }

  function splitTechStack(value) {
    return String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function normalizeString(value) {
    return value == null ? '' : String(value).trim();
  }

  function buildProjectFromRow(row) {
    const id = normalizeString(row.TeamID || row.teamId || row.TeamId);
    return {
      id,
      name: normalizeString(row.ProjectName || row.projectName || row.Name || 'Unknown Project'),
      domain: normalizeString(row.ProjectDomain || row.projectDomain || row.Domain || 'Unknown Domain'),
      status: normalizeString(row.ProjectStatus || row.projectStatus || row.Status || 'Unknown'),
      teamId: id,
      teamName: normalizeString(row.TeamName || row.teamName || row.Name || ''),
      problemStatement: normalizeString(row.ProblemStatement || row.problemStatement || row['Problem Statement']),
      solution: normalizeString(row.Solution || row.solution),
      techStack: splitTechStack(row.TechStack || row.techStack),
    };
  }

  function buildMemberFromRow(row) {
    return {
      id: normalizeString(row.MemberID || row.memberId || row.MemberId),
      name: normalizeString(row.MemberName || row.memberName || row.Name || 'Unknown Member'),
      role: normalizeString(row.Role || row.role),
      responsibilities: normalizeString(row.Responsibilities || row.responsibility),
      teamId: normalizeString(row.TeamID || row.teamId || row.TeamId),
      teamName: normalizeString(row.TeamName || row.teamName || row.Name || ''),
      projectName: normalizeString(row.ProjectName || row.projectName),
    };
  }

  function buildTeamFromRow(row) {
    const id = normalizeString(row.TeamID || row.teamId || row.TeamId);
    return {
      id,
      name: normalizeString(row.TeamName || row.teamName || row.Name || 'Unknown Team'),
      domain: normalizeString(row.ProjectDomain || row.projectDomain || row.Domain || ''),
      status: normalizeString(row.ProjectStatus || row.projectStatus || row.Status || ''),
      projectCount: 0,
      memberCount: 0,
    };
  }

  const projectMap = new Map();
  const teamMap = new Map();
  const memberMap = new Map();

  dataset.rows.forEach((row) => {
    const teamId = normalizeString(row.TeamID || row.teamId || row.TeamId);
    if (!teamId) return;

    if (!projectMap.has(teamId)) {
      projectMap.set(teamId, buildProjectFromRow(row));
    }

    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, buildTeamFromRow(row));
    }

    const team = teamMap.get(teamId);
    if (team) {
      team.memberCount += 1;
    }

    const memberId = normalizeString(row.MemberID || row.memberId || row.MemberId);
    if (memberId && !memberMap.has(memberId)) {
      memberMap.set(memberId, buildMemberFromRow(row));
    }
  });

  for (const team of teamMap.values()) {
    team.projectCount = 1;
  }

  return {
    members: Array.from(memberMap.values()),
    projects: Array.from(projectMap.values()),
    teams: Array.from(teamMap.values()),
  };
}
