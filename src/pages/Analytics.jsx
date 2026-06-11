import { FiActivity, FiDatabase, FiTrendingUp, FiUsers, FiUserCheck, FiBriefcase } from 'react-icons/fi';
import EmptyState from '../components/EmptyState.jsx';
import StatCard from '../components/StatCard.jsx';
import { useDataset } from '../data/DatasetContext.jsx';
import { deriveDatasetEntities } from '../data/dataset.js';

const icons = [FiDatabase, FiUsers, FiUserCheck, FiBriefcase, FiTrendingUp, FiActivity];
const accents = [
  'bg-brand-50 text-brand-600',
  'bg-emerald-50 text-emerald-600',
  'bg-amber-50 text-amber-600',
  'bg-indigo-50 text-indigo-600',
  'bg-rose-50 text-rose-600',
  'bg-cyan-50 text-cyan-600',
];

export default function Analytics() {
  const { activeDataset } = useDataset();

  if (!activeDataset) {
    return <EmptyState title="No Dataset Uploaded" message="Upload a dataset on the Dashboard to view analytics." />;
  }

  const { teams, members, projects } = deriveDatasetEntities(activeDataset);
  const completed = projects.filter((p) => /complete|done/i.test(p.status)).length;
  const ongoing = projects.length - completed;
  const domains = [...new Set(projects.map((p) => p.domain).filter(Boolean))];
  const roles = [...new Set(members.map((m) => m.role).filter(Boolean))];
  const completionRate = projects.length ? Math.round((completed / projects.length) * 100) : 0;

  const stats = [
    { label: 'Dataset Rows',     value: activeDataset.rows.length.toLocaleString(), detail: 'Total records loaded' },
    { label: 'Total Teams',      value: teams.length.toLocaleString(),              detail: 'Detected in dataset' },
    { label: 'Total Members',    value: members.length.toLocaleString(),            detail: `${roles.length} roles` },
    { label: 'Total Projects',   value: projects.length.toLocaleString(),           detail: `${completed} completed` },
    { label: 'Completion Rate',  value: `${completionRate}%`,                       detail: 'Projects marked complete' },
    { label: 'Domains',          value: domains.length.toLocaleString(),            detail: domains.slice(0, 3).join(', ') || 'N/A' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Statistics derived from the uploaded dataset.</p>
      </div>

      {/* Dataset Summary */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-base font-bold text-ink">Dataset Summary</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Teams',    value: teams.length,    accent: 'bg-brand-50 text-brand-600',   icon: FiUsers },
            { label: 'Members',  value: members.length,  accent: 'bg-emerald-50 text-emerald-600', icon: FiUserCheck },
            { label: 'Projects', value: projects.length, accent: 'bg-amber-50 text-amber-600',   icon: FiBriefcase },
          ].map(({ label, value, accent, icon: Icon }) => (
            <div key={label} className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${accent}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-2xl font-bold text-ink">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item, i) => (
          <StatCard key={item.label} icon={icons[i]} label={item.label} value={item.value} detail={item.detail} accent={accents[i]} />
        ))}
      </div>

      {/* Domain & Role breakdown */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-base font-bold text-ink">Project Domains</h2>
          {domains.length ? (
            <div className="flex flex-wrap gap-2">
              {domains.map((d) => (
                <span key={d} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">{d}</span>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No domains detected.</p>}
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-base font-bold text-ink">Member Roles</h2>
          {roles.length ? (
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <span key={r} className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">{r}</span>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No roles detected.</p>}
        </div>
      </div>
    </div>
  );
}
