/**
 * Insight Agent
 * Derives qualitative insights and comparisons from dataset entities.
 */
import { deriveDatasetEntities } from '../data/dataset.js';

/**
 * @param {object} dataset
 * @param {string} query
 * @returns {{ text: string, sources: string } | null}
 */
export function runInsightAgent(dataset, query) {
  const { teams, members, projects } = deriveDatasetEntities(dataset);

  if (/best (performing|team)|top team/i.test(query)) {
    const completed = teams.filter((t) => {
      const p = projects.find((pr) => pr.teamId === t.id);
      return p?.status?.toLowerCase() === 'completed';
    });
    return {
      text: `Teams with completed projects (${completed.length}):\n${completed.map((t) => `- ${t.name}`).join('\n')}\n\nThese teams have successfully delivered their projects.`,
      sources: 'Insight: project completion',
    };
  }

  if (/ongoing|in progress|active (team|project)/i.test(query)) {
    const ongoing = projects.filter((p) => p.status.toLowerCase() === 'ongoing');
    return {
      text: `${ongoing.length} projects are currently ongoing:\n${ongoing.map((p) => `- ${p.name} (${p.teamName})`).join('\n')}`,
      sources: 'Insight: ongoing projects',
    };
  }

  if (/compar|vs|versus/i.test(query)) {
    const completed = projects.filter((p) => p.status.toLowerCase() === 'completed').length;
    const ongoing = projects.filter((p) => p.status.toLowerCase() === 'ongoing').length;
    return {
      text: `Project comparison:\n  Completed: ${completed}\n  Ongoing: ${ongoing}\n  Completion rate: ${Math.round((completed / projects.length) * 100)}%`,
      sources: 'Insight: project comparison',
    };
  }

  if (/recommend|suggest|what should/i.test(query)) {
    const allTech = [...new Set(projects.flatMap((p) => p.techStack))];
    const ongoingDomains = [...new Set(projects.filter((p) => p.status.toLowerCase() === 'ongoing').map((p) => p.domain))];
    return {
      text: `Based on current data:\n- Active development domains: ${ongoingDomains.join(', ')}\n- Core technologies in use: ${allTech.slice(0, 6).join(', ')}\n- ${members.length} members across ${teams.length} teams available for collaboration.`,
      sources: 'Insight: recommendations',
    };
  }

  if (/analyz|overview|summary/i.test(query)) {
    const completed = projects.filter((p) => p.status.toLowerCase() === 'completed').length;
    const domains = [...new Set(projects.map((p) => p.domain))];
    return {
      text: `KnowledgeHub AI Overview:\n- ${teams.length} teams, ${members.length} members, ${projects.length} projects\n- ${completed} completed, ${projects.length - completed} ongoing\n- Domains covered: ${domains.join(', ')}`,
      sources: 'Insight: full overview',
    };
  }

  return null;
}
