/**
 * Team Agent
 * Handles queries about teams — by ID, name, or listing all teams.
 */
import { deriveDatasetEntities } from '../data/dataset.js';

/**
 * @param {object} dataset
 * @param {string} query
 * @returns {{ text: string, sources: string } | null}
 */
export function runTeamAgent(dataset, query) {
  const { teams, members, projects } = deriveDatasetEntities(dataset);
  const q = query.toLowerCase();

  if (/all teams|list teams|show teams|how many teams/i.test(query)) {
    return {
      text: `There are ${teams.length} teams:\n${teams.map((t) => `- ${t.id}: ${t.name} (${t.memberCount} members, ${t.domain})`).join('\n')}`,
      sources: 'Teams data',
    };
  }

  // Match by TeamID (e.g. T001)
  const idMatch = query.match(/\b(T\d{3})\b/i);
  if (idMatch) {
    const team = teams.find((t) => t.id.toLowerCase() === idMatch[1].toLowerCase());
    if (team) return buildTeamDetail(team, members, projects);
  }

  // Match by team name substring
  const teamMatch = teams.find((t) => q.includes(t.name.toLowerCase()));
  if (teamMatch) return buildTeamDetail(teamMatch, members, projects);

  return null;
}

function buildTeamDetail(team, members, projects) {
  const teamMembers = members.filter((m) => m.teamId === team.id);
  const teamProject = projects.find((p) => p.teamId === team.id);

  const lines = [
    `Team: ${team.name} (${team.id})`,
    `Domain: ${team.domain}`,
    teamProject ? `Project: ${teamProject.name} — Status: ${teamProject.status}` : '',
    teamProject ? `Tech Stack: ${teamProject.techStack.join(', ')}` : '',
    `Members (${teamMembers.length}): ${teamMembers.map((m) => `${m.name} [${m.role}]`).join(', ')}`,
  ].filter(Boolean);

  return { text: lines.join('\n'), sources: `Team ${team.id} data` };
}
