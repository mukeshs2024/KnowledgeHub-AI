import { Link } from 'react-router-dom';
import { FiBriefcase } from 'react-icons/fi';

const statusStyles = {
  Completed: 'bg-emerald-50 text-emerald-700',
  Ongoing: 'bg-blue-50 text-blue-700',
  Planning: 'bg-amber-50 text-amber-700',
};

export default function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project.id}`} className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{project.id}</p>
          <h3 className="mt-2 text-lg font-bold text-ink">{project.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{project.teamName}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600">
          <FiBriefcase />
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[project.status] || 'bg-slate-100 text-slate-700'}`}>
          {project.status}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{project.domain}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.techStack.map((tech) => (
          <span key={tech} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
            {tech}
          </span>
        ))}
      </div>
    </Link>
  );
}
