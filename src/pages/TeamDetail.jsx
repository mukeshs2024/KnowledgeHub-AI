import { useParams } from 'react-router-dom';
import { members, projects, teams } from '../data/dataset.js';
import { DetailCard, DetailPage, InfoRow, StatusBadge, TagList } from '../components/DetailLayout.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function TeamDetail() {
  const { teamId } = useParams();
  const team = teams.find((t) => t.id === teamId);

  if (!team) return <EmptyState title="Team not found" />;

  const project = projects.find((p) => p.id === teamId);
  const teamMembers = members.filter((m) => m.teamId === teamId);

  return (
    <DetailPage title={team.name} subtitle={`Team ID: ${team.id}`}>
      <div className="grid gap-5 lg:grid-cols-2">
        <DetailCard title="Team Overview">
          <dl>
            <InfoRow label="Team ID" value={team.id} />
            <InfoRow label="Team Name" value={team.name} />
            <InfoRow label="Domain" value={team.domain} />
            <InfoRow label="Status" value={<StatusBadge status={team.status} />} />
            <InfoRow label="Total Projects" value={team.projectCount} />
            <InfoRow label="Total Members" value={team.memberCount} />
          </dl>
        </DetailCard>

        {project && (
          <DetailCard title="Project Details">
            <dl>
              <InfoRow label="Project Name" value={project.name} />
              <InfoRow label="Status" value={<StatusBadge status={project.status} />} />
              <InfoRow label="Domain" value={project.domain} />
            </dl>
            <div className="mt-3">
              <p className="mb-2 text-sm text-slate-500">Tech Stack</p>
              <TagList items={project.techStack} />
            </div>
          </DetailCard>
        )}
      </div>

      {teamMembers.length > 0 && (
        <DetailCard title={`Members (${teamMembers.length})`}>
          <div className="divide-y divide-slate-100">
            {teamMembers.map((m) => (
              <div key={m.id} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.role}</p>
                </div>
                <span className="text-xs text-slate-400">{m.id}</span>
              </div>
            ))}
          </div>
        </DetailCard>
      )}
    </DetailPage>
  );
}
