import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { useDataset } from '../data/DatasetContext.jsx';
import { deriveDatasetEntities } from '../data/dataset.js';
import { FiUser } from 'react-icons/fi';

export default function Members() {
  const { activeDataset } = useDataset();
  const [query, setQuery] = useState('');

  if (!activeDataset) {
    return <EmptyState title="No Dataset Uploaded" message="Upload a dataset on the Dashboard to view members." />;
  }

  const { members } = deriveDatasetEntities(activeDataset);

  const filtered = useMemo(() =>
    members.filter((m) =>
      [m.name, m.id, m.role, m.teamName, m.projectName].join(' ').toLowerCase().includes(query.toLowerCase())
    ), [members, query]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Members</h1>
        <p className="mt-1 text-sm text-slate-500">Browse members detected from the uploaded dataset.</p>
      </div>
      <SearchBar value={query} onChange={setQuery} placeholder="Search members by name, role, or team" />
      {!filtered.length ? (
        <EmptyState title="No members found" message="Try adjusting your search." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((member) => (
            <Link
              key={member.id || member.name}
              to={`/members/${member.id}`}
              className="block rounded-2xl border border-slate-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
            >
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
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Team</dt>
                  <dd className="text-right font-medium text-slate-800">{member.teamName || '—'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Project</dt>
                  <dd className="text-right font-medium text-slate-800">{member.projectName || '—'}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
