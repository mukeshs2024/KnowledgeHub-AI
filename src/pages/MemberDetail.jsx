import { useParams } from 'react-router-dom';
import { members, projects } from '../data/dataset.js';
import { DetailCard, DetailPage, InfoRow, StatusBadge, TagList } from '../components/DetailLayout.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function MemberDetail() {
  const { memberId } = useParams();
  const member = members.find((m) => m.id === memberId);

  if (!member) return <EmptyState title="Member not found" />;

  const project = projects.find((p) => p.id === member.teamId);

  return (
    <DetailPage title={member.name} subtitle={`${member.role} · ${member.teamName}`}>
      <div className="grid gap-5 lg:grid-cols-2">
        <DetailCard title="Member Profile">
          <dl>
            <InfoRow label="Member ID" value={member.id} />
            <InfoRow label="Full Name" value={member.name} />
            <InfoRow label="Role" value={member.role} />
            <InfoRow label="Team" value={member.teamName} />
            <InfoRow label="Project" value={member.projectName} />
          </dl>
        </DetailCard>

        <DetailCard title="Responsibilities">
          <p className="text-sm leading-6 text-slate-700">{member.responsibilities || '—'}</p>
        </DetailCard>
      </div>

      {project && (
        <DetailCard title="Project Info">
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
    </DetailPage>
  );
}
