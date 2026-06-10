import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { useDataset } from '../data/DatasetContext.jsx';

export default function Members() {
  const { dataset } = useDataset();
  const [query, setQuery] = useState('');

  const records = useMemo(() => {
    return dataset.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => Object.values(row).join(' ').toLowerCase().includes(query.toLowerCase()))
      .slice(0, 60);
  }, [dataset.rows, query]);

  const previewColumns = dataset.columns.slice(0, 6);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Records</h1>
        <p className="mt-1 text-sm text-slate-500">Browse rows from the active dataset without any predefined schema.</p>
      </div>
      <SearchBar value={query} onChange={setQuery} placeholder="Search across every field and value" />
      {records.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {records.map(({ row, index }) => (
            <article key={index} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-ink">Record {index + 1}</h2>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{dataset.fileType}</span>
              </div>
              <dl className="mt-4 space-y-3">
                {previewColumns.map((column) => (
                  <div key={column.name} className="grid gap-1 sm:grid-cols-[150px_1fr]">
                    <dt className="text-sm font-semibold text-slate-500">{column.label}</dt>
                    <dd className="break-words text-sm text-slate-800">{String(row[column.name] ?? '') || 'N/A'}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No records found" />
      )}
    </div>
  );
}
