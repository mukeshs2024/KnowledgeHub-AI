import { useMemo, useState } from 'react';
import { FiDatabase, FiFile, FiRefreshCw, FiUploadCloud } from 'react-icons/fi';
import SearchBar from '../components/SearchBar.jsx';
import StatCard from '../components/StatCard.jsx';
import { useDataset } from '../data/DatasetContext.jsx';
import { parseUploadedFile, deriveDatasetEntities } from '../data/dataset.js';
import { agenticAISystem } from '../lib/agenticAISystem.js';

export default function Dashboard() {
  const { activeDataset, setActiveDataset, resetDataset } = useDataset();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClearDataset = () => {
    resetDataset();
    agenticAISystem.reset();
  };

  const visibleColumns = useMemo(() => {
    if (!activeDataset) return [];
    return activeDataset.columns.filter((column) => column.label.toLowerCase().includes(query.toLowerCase()));
  }, [activeDataset, query]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsLoading(true);
    try {
      // Parse dataset with existing system
      const dataset = await parseUploadedFile(file);
      setActiveDataset(dataset);

      // Initialize Agentic AI System in parallel
      const fileContent = await file.text();
      const fileType = file.name.split('.').pop()?.toUpperCase() || 'CSV';
      
      agenticAISystem.processDataset(fileContent, file.name, fileType).catch(err => {
        console.warn('Agentic AI System initialization failed:', err);
        // System will still work with basic retrieval
      });
    } catch (uploadError) {
      setError(uploadError.message || 'Dataset upload failed.');
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-ink p-6 text-white shadow-soft sm:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-blue-200">KnowledgeHub AI</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Team & project intelligence for every uploaded dataset.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Upload a CSV, XLSX, or JSON file to explore teams, members, projects, and ask AI questions.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Upload Dataset</h2>
            <p className="mt-1 text-sm text-slate-500">Supported formats: CSV, XLSX, and JSON.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="focus-ring inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700">
              <FiUploadCloud />
              {isLoading ? 'Analyzing...' : 'Choose file'}
              <input type="file" accept=".csv,.xlsx,.json" onChange={handleUpload} className="sr-only" />
            </label>
            <button
              type="button"
              onClick={handleClearDataset}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FiRefreshCw />
              Clear dataset
            </button>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        {!activeDataset ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-slate-700">
            <h3 className="text-lg font-semibold text-slate-900">No Dataset Uploaded</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Upload a dataset to begin analysis, schema detection, document generation, and AI retrieval.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {['CSV', 'XLSX', 'JSON'].map((format) => (
                <div key={format} className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm font-semibold text-slate-700">
                  {format}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {activeDataset ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={FiFile} label="Dataset" value={activeDataset.fileName} detail="Active knowledge source" />
            <StatCard icon={FiDatabase} label="File Type" value={activeDataset.fileType} detail={activeDataset.metadata.datasetCategory} accent="bg-emerald-50 text-emerald-600" />
            {(() => {
              const { teams, members, projects } = deriveDatasetEntities(activeDataset);
              const completed = projects.filter((p) => /complete|completed|done/i.test(p.status)).length;
              const ongoing = projects.length - completed;
              return (
                <>
                  <StatCard label="Teams" value={teams.length.toLocaleString()} detail="Detected teams" accent="bg-amber-50 text-amber-600" />
                  <StatCard label="Members" value={members.length.toLocaleString()} detail="Detected members" accent="bg-indigo-50 text-indigo-600" />
                </>
              );
            })()}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
              <h2 className="text-lg font-bold text-ink">Dataset Overview</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {(() => {
                    const { teams, members, projects } = deriveDatasetEntities(activeDataset);
                    const completed = projects.filter((p) => /complete|completed|done/i.test(p.status)).length;
                    const ongoing = projects.length - completed;
                    const domains = [...new Set(projects.map((p) => p.domain).filter(Boolean))];
                    return (
                      <>
                        <InfoBlock label="Dataset Category" value={activeDataset.metadata.datasetCategory} />
                        <InfoBlock label="Upload Time" value={formatDateTime(activeDataset.uploadedAt)} />
                        <InfoBlock label="Total Teams" value={teams.length} />
                        <InfoBlock label="Total Members" value={members.length} />
                        <InfoBlock label="Total Projects" value={projects.length} />
                        <InfoBlock label="Completed Projects" value={completed} />
                        <InfoBlock label="Ongoing Projects" value={ongoing} />
                        <InfoBlock label="Detected Domains" value={domains.slice(0, 5).join(', ') || 'N/A'} />
                      </>
                    );
                  })()}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
              <h2 className="text-lg font-bold text-ink">Detected Intelligence</h2>
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                <InfoBlock label="Dataset Type" value={activeDataset.metadata.datasetType} />
                <InfoBlock label="Inferred Entities" value={activeDataset.metadata.entities.join(', ')} />
                <InfoBlock label="Analysis Pipeline" value={activeDataset.metadata.agents.join(' → ')} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink">Detected Schema</h2>
                <p className="mt-1 text-sm text-slate-500">Field names, inferred data types, missing values, and sample values.</p>
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
        </>
      ) : null}
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

function formatDateTime(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
