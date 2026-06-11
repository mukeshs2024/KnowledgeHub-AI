/**
 * Analytics Agent
 * Handles aggregation queries: counts, averages, distributions, trends.
 */
import { deriveDatasetEntities } from '../data/dataset.js';

/**
 * @param {object} dataset
 * @param {string} query
 * @returns {{ text: string, sources: string } | null}
 */
export function runAnalyticsAgent(dataset, query) {
  const { teams, members, projects } = deriveDatasetEntities(dataset);

  if (/how many teams/i.test(query)) {
    return { text: `Total teams: ${teams.length}`, sources: 'Analytics: teams count' };
  }

  if (/how many members/i.test(query)) {
    return { text: `Total members: ${members.length}`, sources: 'Analytics: members count' };
  }

  if (/how many projects/i.test(query)) {
    return { text: `Total projects: ${projects.length}`, sources: 'Analytics: projects count' };
  }

  if (/status (distribution|breakdown|summary)/i.test(query) || /project status/i.test(query)) {
    const groups = projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {});
    const lines = Object.entries(groups).map(([s, n]) => `  ${s}: ${n} project${n > 1 ? 's' : ''}`);
    return { text: `Project status distribution:\n${lines.join('\n')}`, sources: 'Analytics: project statuses' };
  }

  if (/domain (distribution|breakdown|summary)/i.test(query) || /domains/i.test(query)) {
    const groups = projects.reduce((acc, p) => {
      acc[p.domain] = (acc[p.domain] ?? 0) + 1;
      return acc;
    }, {});
    const lines = Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([d, n]) => `  ${d}: ${n}`);
    return { text: `Projects by domain:\n${lines.join('\n')}`, sources: 'Analytics: domains' };
  }

  if (/role (distribution|breakdown|summary)/i.test(query) || /roles/i.test(query)) {
    const groups = members.reduce((acc, m) => {
      acc[m.role] = (acc[m.role] ?? 0) + 1;
      return acc;
    }, {});
    const lines = Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([r, n]) => `  ${r}: ${n}`);
    return { text: `Member role distribution:\n${lines.join('\n')}`, sources: 'Analytics: roles' };
  }

  if (/tech(nology)? (distribution|breakdown|summary|count)/i.test(query) || /most used tech/i.test(query)) {
    const techCount = {};
    projects.forEach((p) => p.techStack.forEach((t) => { techCount[t] = (techCount[t] ?? 0) + 1; }));
    const sorted = Object.entries(techCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      text: `Most used technologies:\n${sorted.map(([t, n]) => `  ${t}: ${n} project${n > 1 ? 's' : ''}`).join('\n')}`,
      sources: 'Analytics: tech stack',
    };
  }

  if (/how many (rows|records)|total records/i.test(query)) {
    return {
      text: `Dataset has ${dataset.rows.length.toLocaleString()} records across ${dataset.columns.length} fields.`,
      sources: 'Analytics: dataset summary',
    };
  }

  return null;
}
