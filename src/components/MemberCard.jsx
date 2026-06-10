import { Link } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';

export default function MemberCard({ member }) {
  return (
    <Link to={`/members/${member.id}`} className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <FiUser className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{member.id}</p>
          <h3 className="mt-1 truncate text-lg font-bold text-ink">{member.name}</h3>
          <p className="text-sm font-medium text-brand-600">{member.role}</p>
        </div>
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Team</dt>
          <dd className="text-right font-medium text-slate-800">{member.teamName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Project</dt>
          <dd className="text-right font-medium text-slate-800">{member.projectName}</dd>
        </div>
      </dl>
    </Link>
  );
}
