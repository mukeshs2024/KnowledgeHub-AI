import { useState } from 'react';
import { FiDatabase, FiFile, FiRefreshCw, FiUploadCloud } from 'react-icons/fi';
import SearchBar from '../components/SearchBar.jsx';
import StatCard from '../components/StatCard.jsx';
import { useDataset } from '../data/DatasetContext.jsx';
import { parseUploadedFile } from '../data/dataset.js';

export default function Dashboard() {
  const { dataset, setDataset, resetDataset } = useDataset();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const visibleColumns = dataset.columns.filter((column) => column.label.toLowerCase().includes(query.toLowerCase()));

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsLoading(true);
    try {
      setDataset(await parseUploadedFile(file));
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to analyze this file.');
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-ink p-6 text-white shadow-soft sm:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-blue-200">Universal AI Knowledge Assistant</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Upload any structured dataset.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            The assistant detects CSV, Excel, or JSON structure, generates schema-aware documents, and answers questions from the active knowledge base.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Upload Dataset</h2>
            <p className="mt-1 text-sm text-slate-500">Supported formats: CSV, XLSX, and JSON with any schema.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="focus-ring inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700">
              <FiUploadCloud />
              {isLoading ? 'Analyzing...' : 'Choose file'}
              <input type="file" accept=".csv,.xlsx,.json" onChange={handleUpload} className="sr-only" />
            </label>
            <button
              type="button"
              onClick={resetDataset}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FiRefreshCw />
              Reset sample
            </button>
          </div>
        </div>
        {error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiFile} label="File Name" value={dataset.fileName} detail="Active knowledge source" />
        <StatCard icon={FiDatabase} label="File Type" value={dataset.fileType} detail={dataset.metadata.datasetType} accent="bg-emerald-50 text-emerald-600" />
        <StatCard label="Rows" value={dataset.rows.length.toLocaleString()} detail="Records available for retrieval" accent="bg-amber-50 text-amber-600" />
        <StatCard label="Columns" value={dataset.columns.length.toLocaleString()} detail="Detected fields" accent="bg-indigo-50 text-indigo-600" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Dataset Summary</h2>
          <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{dataset.summary}</pre>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-bold text-ink">Detected Intelligence</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <InfoBlock label="Dataset Type" value={dataset.metadata.datasetType} />
            <InfoBlock label="Detected Entities" value={dataset.metadata.entities.join(', ')} />
            <InfoBlock label="Agent Pipeline" value={dataset.metadata.agents.join(' -> ')} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Detected Fields</h2>
            <p className="mt-1 text-sm text-slate-500">Column names, inferred data types, missing values, and sample values.</p>
          </div>
          <div className="max-w-md flex-1">
            <SearchBar value={query} onChange={setQuery} placeholder="Search detected fields" />
          </div>
        </div>
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Field</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Missing</th>
                <th className="px-4 py-3">Unique</th>
                <th className="px-4 py-3">Samples</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleColumns.map((column) => (
                <tr key={column.name}>
                  <td className="px-4 py-3 font-semibold text-slate-800">{column.label}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{column.type}</td>
                  <td className="px-4 py-3 text-slate-600">{column.missingCount}</td>
                  <td className="px-4 py-3 text-slate-600">{column.uniqueCount}</td>
                  <td className="px-4 py-3 text-slate-500">{column.sampleValues.join(', ') || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-medium text-slate-800">{value}</p>
    </div>
  );
}
