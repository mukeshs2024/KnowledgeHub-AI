import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { useDataset } from '../data/DatasetContext.jsx';

export default function Projects() {
  const { dataset } = useDataset();
  const [query, setQuery] = useState('');

  const documents = useMemo(() => {
    return dataset.documents.filter((document) => document.text.toLowerCase().includes(query.toLowerCase())).slice(0, 50);
  }, [dataset.documents, query]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Generated Documents</h1>
        <p className="mt-1 text-sm text-slate-500">Every row is converted into natural-language text for retrieval and embedding.</p>
      </div>
      <SearchBar value={query} onChange={setQuery} placeholder="Search generated document text" />
      {documents.length ? (
        <div className="space-y-4">
          {documents.map((document) => (
            <article key={document.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-ink">{document.id}</h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Embedding ready</span>
              </div>
              <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{document.text}</pre>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No documents found" />
      )}
    </div>
  );
}
