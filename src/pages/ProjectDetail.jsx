import { useParams } from 'react-router-dom';
import { members, projects } from '../data/dataset.js';
import { DetailCard, DetailPage, InfoRow, StatusBadge, TagList } from '../components/DetailLayout.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const project = projects.find((p) => p.id === projectId);

  if (!project) return <EmptyState title="Project not found" />;

  const projectMembers = members.filter((m) => m.teamId === projectId);

  return (
    <DetailPage title={project.name} subtitle={`${project.teamName} · ${project.domain}`}>
      <div className="grid gap-5 lg:grid-cols-2">
        <DetailCard title="Project Overview">
          <dl>
            <InfoRow label="Project ID" value={project.id} />
            <InfoRow label="Team" value={project.teamName} />
            <InfoRow label="Domain" value={project.domain} />
            <InfoRow label="Status" value={<StatusBadge status={project.status} />} />
          </dl>
          <div className="mt-3">
            <p className="mb-2 text-sm text-slate-500">Tech Stack</p>
            <TagList items={project.techStack} />
          </div>
        </DetailCard>

        <div className="space-y-5">
          <DetailCard title="Problem Statement">
            <p className="text-sm leading-6 text-slate-700">{project.problemStatement || '—'}</p>
          </DetailCard>
          <DetailCard title="Solution">
            <p className="text-sm leading-6 text-slate-700">{project.solution || '—'}</p>
          </DetailCard>
        </div>
      </div>

      {projectMembers.length > 0 && (
        <DetailCard title={`Team Members (${projectMembers.length})`}>
          <div className="divide-y divide-slate-100">
            {projectMembers.map((m) => (
              <div key={m.id} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.role}</p>
                </div>
                <p className="text-xs text-slate-400 sm:text-right max-w-xs truncate">{m.responsibilities}</p>
              </div>
            ))}
          </div>
        </DetailCard>
      )}
    </DetailPage>
  );
}
