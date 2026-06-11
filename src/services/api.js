// ─── API Service Layer ────────────────────────────────────────────────────────
// To connect the real backend:
//   1. Add VITE_API_URL=http://localhost:8000 to .env
//   2. Set USE_MOCK = false
// No other file needs to change.
// ─────────────────────────────────────────────────────────────────────────────

import { getMemberById, getProjectById, getTeamById, getTeamMembers } from '../data/dataset.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const USE_MOCK = true;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const normalizeId = (text) => {
  const match = text.match(/\b(T\d+)\b/i) || text.match(/\b(M\d+)\b/i);
  return match?.[1].toUpperCase() ?? null;
};

const buildTeamAnswer = (teamId) => {
  const team = getTeamById(teamId);
  if (!team) return null;
  const project = getProjectById(teamId);
  const members = getTeamMembers(teamId);
  return {
    text: `Team ID ${team.id}, ${team.name}: Project ${project?.name ?? 'N/A'} (${project?.domain ?? 'N/A'}) — Status: ${project?.status ?? 'N/A'} — Tech stack: ${project?.techStack.join(', ') || 'N/A'}. Team members: ${members.map((member) => member.role).join(', ')}.`,
    agent: 'Team Agent',
    coordinator_reasoning: `Exact team lookup for ${teamId}.`,
    sources: [team.name, project?.name ?? 'Unknown Project'],
    retrieval_count: 1,
    confidence: 'High',
    workflow: ['User Query', 'Coordinator Agent', 'Team Agent', 'Knowledge Retrieval', 'Response Generation'],
  };
};

const buildMemberAnswer = (memberId) => {
  const member = getMemberById(memberId);
  if (!member) return null;
  return {
    text: `Member ID ${member.id}, ${member.name}: ${member.role} on team ${member.teamName} working on ${member.projectName}. Responsibilities: ${member.responsibilities}.`,
    agent: 'Member Agent',
    coordinator_reasoning: `Exact member lookup for ${memberId}.`,
    sources: [member.name, member.teamName],
    retrieval_count: 1,
    confidence: 'High',
    workflow: ['User Query', 'Coordinator Agent', 'Member Agent', 'Knowledge Retrieval', 'Response Generation'],
  };
};

function mockAsk(question) {
  const lowerQuestion = question.toLowerCase();
  const exactId = normalizeId(question);

  if (exactId) {
    if (exactId.startsWith('T')) {
      const answer = buildTeamAnswer(exactId);
      if (answer) return answer;
    }
    if (exactId.startsWith('M')) {
      const answer = buildMemberAnswer(exactId);
      if (answer) return answer;
    }
  }

  if (lowerQuestion.includes('team'))
    return {
      text: 'Found teams in the knowledge base. Use a specific team ID or team name for exact results.',
      agent: 'Team Agent',
      coordinator_reasoning: 'Query contains team-related keywords. Routing to Team Agent.',
      sources: ['Alpha Innovators', 'Data Wizards', 'Tech Titans', 'Vision Crafters'],
      retrieval_count: 4,
      confidence: 'High',
      workflow: ['User Query', 'Coordinator Agent', 'Team Agent', 'Knowledge Retrieval', 'Response Generation'],
    };

  if (lowerQuestion.includes('member'))
    return {
      text: 'The knowledge base contains members across multiple teams with roles like Frontend Developer, Backend Developer, and Data Analyst. Use a specific member ID for exact results.',
      agent: 'Member Agent',
      coordinator_reasoning: 'Query contains member-related keywords. Routing to Member Agent.',
      sources: ['Member_1', 'Member_5', 'Member_9'],
      retrieval_count: 3,
      confidence: 'High',
      workflow: ['User Query', 'Coordinator Agent', 'Member Agent', 'Knowledge Retrieval', 'Response Generation'],
    };

  if (lowerQuestion.includes('project'))
    return {
      text: 'Multiple projects tracked across domains including Smart City, Education, Healthcare, and Agriculture.',
      agent: 'Project Agent',
      coordinator_reasoning: 'Query contains project-related keywords. Routing to Project Agent.',
      sources: ['Smart Waste Management System', 'AI Student Performance Predictor', 'Hospital Appointment Management'],
      retrieval_count: 3,
      confidence: 'Medium',
      workflow: ['User Query', 'Coordinator Agent', 'Project Agent', 'Knowledge Retrieval', 'Response Generation'],
    };

  return {
    text: 'I searched the knowledge base using semantic retrieval and found related information across teams, members, and projects. For exact results, ask with a specific team or member ID.',
    agent: 'RAG Agent',
    coordinator_reasoning: 'No specific entity detected. Falling back to semantic RAG search.',
    sources: ['Alpha Innovators', 'Smart Waste Management System'],
    retrieval_count: 2,
    confidence: 'Low',
    workflow: ['User Query', 'Coordinator Agent', 'RAG Agent', 'Knowledge Retrieval', 'Response Generation'],
  };
}

// ─── Exported API functions ───────────────────────────────────────────────────

export async function askAI(question) {
  if (USE_MOCK) { await delay(800); return mockAsk(question); }
  const res = await fetch(`${BASE_URL}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

export async function getTeams() {
  if (USE_MOCK) { await delay(600); return []; } // pages use local dataset; hook ready for backend
  const res = await fetch(`${BASE_URL}/teams`);
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

export async function getMembers() {
  if (USE_MOCK) { await delay(600); return []; }
  const res = await fetch(`${BASE_URL}/members`);
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

export async function getProjects() {
  if (USE_MOCK) { await delay(600); return []; }
  const res = await fetch(`${BASE_URL}/projects`);
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

export async function getAnalytics() {
  if (USE_MOCK) { await delay(600); return null; }
  const res = await fetch(`${BASE_URL}/analytics`);
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

export async function checkBackendStatus() {
  if (USE_MOCK) { await delay(300); return 'offline'; }
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok ? 'connected' : 'offline';
  } catch {
    return 'offline';
  }
}
