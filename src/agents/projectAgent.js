/**
 * Project Agent
 * Handles queries about projects — by name, domain, status, tech stack, or role.
 */
import { deriveDatasetEntities } from '../data/dataset.js';

const DOMAINS = ['business', 'healthcare', 'education', 'retail', 'agriculture', 'cybersecurity', 'transportation', 'smart city', 'hr tech', 'events'];
const STATUSES = ['completed', 'ongoing'];

/**
 * @param {object} dataset
 * @param {string} query
 * @returns {{ text: string, sources: string } | null}
 */
export function runProjectAgent(dataset, query) {
  const { projects, members } = deriveDatasetEntities(dataset);
  const q = query.toLowerCase();

  if (/all projects|list projects|show projects|how many projects/i.test(query)) {
    return {
      text: `There are ${projects.length} projects:\n${projects.map((p) => `- ${p.name} (${p.domain}, ${p.status})`).join('\n')}`,
      sources: 'Projects data',
    };
  }

  // Match by project name
  const projectMatch = projects.find((p) => q.includes(p.name.toLowerCase()));
  if (projectMatch) {
    const projectMembers = members.filter((m) => m.teamId === projectMatch.teamId);
    const lines = [
      `Project: ${projectMatch.name}`,
      `Team: ${projectMatch.teamName}`,
      `Domain: ${projectMatch.domain}`,
      `Status: ${projectMatch.status}`,
      `Tech Stack: ${projectMatch.techStack.join(', ')}`,
      `Problem: ${projectMatch.problemStatement}`,
      `Solution: ${projectMatch.solution}`,
      `Members: ${projectMembers.map((m) => `${m.name} [${m.role}]`).join(', ')}`,
    ];
    return { text: lines.join('\n'), sources: `Project "${projectMatch.name}" data` };
  }

  // Match by status
  const statusMatch = STATUSES.find((s) => q.includes(s));
  if (statusMatch) {
    const filtered = projects.filter((p) => p.status.toLowerCase() === statusMatch);
    return {
      text: `Projects with status "${statusMatch}" (${filtered.length}):\n${filtered.map((p) => `- ${p.name} (${p.teamName})`).join('\n')}`,
      sources: 'Projects status data',
    };
  }

  // Match by domain
  const domainMatch = DOMAINS.find((d) => q.includes(d));
  if (domainMatch) {
    const filtered = projects.filter((p) => p.domain.toLowerCase() === domainMatch);
    return {
      text: `Projects in "${domainMatch}" domain (${filtered.length}):\n${filtered.map((p) => `- ${p.name} (${p.teamName})`).join('\n')}`,
      sources: 'Projects domain data',
    };
  }

  // Match by tech keyword
  if (/tech|technology|stack|framework|uses|language/i.test(query)) {
    const techTokens = q.replace(/tech stack|technology|uses|framework|language/g, '').trim().split(/\s+/).filter(Boolean);
    if (techTokens.length) {
      const filtered = projects.filter((p) => techTokens.some((t) => p.techStack.join(' ').toLowerCase().includes(t)));
      if (filtered.length) {
        return {
          text: `Projects using "${techTokens.join(', ')}":\n${filtered.map((p) => `- ${p.name} (${p.techStack.join(', ')})`).join('\n')}`,
          sources: 'Projects tech stack data',
        };
      }
    }
    // All tech stacks
    const allTech = [...new Set(projects.flatMap((p) => p.techStack))];
    return { text: `Technologies used across all projects: ${allTech.join(', ')}.`, sources: 'Projects tech stack data' };
  }

  return null;
}
