import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { useDataset } from '../data/DatasetContext.jsx';

export default function Teams() {
  const { dataset } = useDataset();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');

  const types = ['All', ...new Set(dataset.columns.map((column) => column.type))];
  const fields = useMemo(() => {
    return dataset.columns.filter((column) => {
      const content = [column.label, column.type, column.sampleValues.join(' ')].join(' ').toLowerCase();
      return content.includes(query.toLowerCase()) && (type === 'All' || column.type === type);
    });
  }, [dataset.columns, query, type]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Schema</h1>
        <p className="mt-1 text-sm text-slate-500">Detected fields, inferred types, missing values, and relationship hints.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <SearchBar value={query} onChange={setQuery} placeholder="Search fields by name, type, or sample value" />
        <select value={type} onChange={(event) => setType(event.target.value)} className="focus-ring h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm">
          {types.map((fieldType) => (
            <option key={fieldType}>{fieldType}</option>
          ))}
        </select>
      </div>
      {fields.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fields.map((field) => (
            <article key={field.name} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-ink">{field.label}</h2>
                  <p className="mt-1 text-sm capitalize text-slate-500">{field.type} field</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{field.uniqueCount} unique</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Metric label="Present" value={field.presentCount} />
                <Metric label="Missing" value={field.missingCount} />
              </dl>
              <p className="mt-4 text-sm leading-6 text-slate-500">Samples: {field.sampleValues.join(', ') || 'N/A'}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No fields found" />
      )}
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
