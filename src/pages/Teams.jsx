import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import TeamCard from '../components/TeamCard.jsx';
import { useDataset } from '../data/DatasetContext.jsx';
import { deriveDatasetEntities } from '../data/dataset.js';

export default function Teams() {
  const { activeDataset } = useDataset();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');

  if (!activeDataset) {
    return <EmptyState title="No Dataset Uploaded" message="Upload a dataset to view teams." />;
  }
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">Teams</h1>
          <p className="mt-1 text-sm text-slate-500">Browse teams detected from the uploaded dataset.</p>
        </div>

        {(() => {
          const { teams } = deriveDatasetEntities(activeDataset);
          if (!teams.length) return <EmptyState title="No teams found" message="No team-like columns detected in the uploaded dataset." />;
          return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{teams.map((team) => <TeamCard key={team.id || team.name} team={team} />)}</div>;
        })()}
      </div>
    );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 font-bold text-slate-800">{value}</dd>
    </div>
  );
}
