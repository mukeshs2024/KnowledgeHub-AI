/**
 * Member Agent
 * Handles queries about individual members — by ID, name, or role.
 */
import { deriveDatasetEntities } from '../data/dataset.js';

/**
 * @param {object} dataset
 * @param {string} query
 * @returns {{ text: string, sources: string } | null}
 */
export function runMemberAgent(dataset, query) {
  const { members } = deriveDatasetEntities(dataset);
  const q = query.toLowerCase();

  if (/all members|list members|show members|how many members/i.test(query)) {
    return {
      text: `There are ${members.length} members:\n${members.map((m) => `- ${m.id}: ${m.name} (${m.role}, ${m.teamName})`).join('\n')}`,
      sources: 'Members data',
    };
  }

  // Match by MemberID (e.g. M001)
  const idMatch = query.match(/\b(M\d{3})\b/i);
  if (idMatch) {
    const member = members.find((m) => m.id.toLowerCase() === idMatch[1].toLowerCase());
    if (member) return buildMemberProfile(member);
  }

  // Match by member name
  const nameMatch = members.find((m) => q.includes(m.name.toLowerCase()));
  if (nameMatch) return buildMemberProfile(nameMatch);

  // Match by role
  const roles = ['frontend developer', 'backend developer', 'data analyst', 'project manager'];
  const roleMatch = roles.find((r) => q.includes(r));
  if (roleMatch) {
    const matched = members.filter((m) => m.role.toLowerCase() === roleMatch);
    return {
      text: `Members with role "${roleMatch}":\n${matched.map((m) => `- ${m.name} (${m.teamName})`).join('\n')}`,
      sources: 'Members data',
    };
  }

  return null;
}

function buildMemberProfile(member) {
  const lines = [
    `Member: ${member.name} (${member.id})`,
    `Role: ${member.role}`,
    `Team: ${member.teamName} (${member.teamId})`,
    `Project: ${member.projectName}`,
    `Responsibilities: ${member.responsibilities}`,
  ];
  return { text: lines.join('\n'), sources: `Member ${member.id} profile` };
}
