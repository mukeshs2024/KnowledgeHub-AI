import { Link } from 'react-router-dom';
import { FiUsers } from 'react-icons/fi';

export default function TeamCard({ team }) {
  return (
    <Link to={`/teams/${team.id}`} className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{team.id}</p>
          <h3 className="mt-2 text-lg font-bold text-ink">{team.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{team.domain}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <FiUsers />
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Projects</p>
          <p className="text-xl font-bold text-ink">{team.projectCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Members</p>
          <p className="text-xl font-bold text-ink">{team.memberCount}</p>
        </div>
      </div>
    </Link>
  );
}
