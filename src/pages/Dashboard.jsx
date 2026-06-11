import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBriefcase, FiCheckCircle, FiFile, FiLayers,
  FiMessageSquare, FiRefreshCw, FiUploadCloud,
  FiUserCheck, FiUsers, FiBarChart2,
} from 'react-icons/fi';
import StatCard from '../components/StatCard.jsx';
import { useDataset } from '../data/DatasetContext.jsx';
import { deriveDatasetEntities, parseUploadedFile } from '../data/dataset.js';

const quickLinks = [
  { to: '/ask-ai',    label: 'Ask AI',    icon: FiMessageSquare, accent: 'bg-brand-50 text-brand-700 border-brand-100' },
  { to: '/teams',     label: 'Teams',     icon: FiUsers,         accent: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { to: '/members',   label: 'Members',   icon: FiUserCheck,     accent: 'bg-amber-50 text-amber-700 border-amber-100' },
  { to: '/projects',  label: 'Projects',  icon: FiBriefcase,     accent: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { to: '/analytics', label: 'Analytics', icon: FiBarChart2,     accent: 'bg-purple-50 text-purple-700 border-purple-100' },
];

export default function Dashboard() {
  const { activeDataset, setActiveDataset, resetDataset } = useDataset();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file) return;
    setError('');
    setIsLoading(true);
    try {
      setActiveDataset(await parseUploadedFile(file));
    } catch (err) {
      setError(err.message || 'Dataset upload failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const onFileInput = (e) => { handleUpload(e.target.files?.[0]); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files?.[0]); };

  const entities = activeDataset ? deriveDatasetEntities(activeDataset) : null;
  const completed = entities?.projects.filter((p) => /complete|done/i.test(p.status)).length ?? 0;
  const ongoing = entities ? entities.projects.length - completed : 0;

  return (
    <div className="space-y-5">

      {/* Upload Card */}
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-ink">Upload Dataset</h2>
            <p className="mt-0.5 text-sm text-slate-500">Supported: CSV, XLSX, JSON</p>
          </div>
          <div className="flex gap-3">
            <label className="focus-ring inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700">
              <FiUploadCloud className="h-4 w-4" />
              {isLoading ? 'Analyzing…' : 'Choose File'}
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.json" onChange={onFileInput} className="sr-only" />
            </label>
            {activeDataset && (
              <button
                type="button"
                onClick={resetDataset}
                className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <FiRefreshCw className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {error && <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {!activeDataset ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-4 flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition ${
              dragOver ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50'
            }`}
          >
            <FiUploadCloud className={`h-8 w-8 ${dragOver ? 'text-brand-600' : 'text-slate-400'}`} />
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">Drop your file here or click to browse</p>
              <p className="mt-1 text-xs text-slate-400">CSV · XLSX · JSON</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <FiFile className="h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-emerald-800">{activeDataset.fileName}</p>
              <p className="text-xs text-emerald-600">{activeDataset.rows.length} rows · {activeDataset.columns.length} columns</p>
            </div>
          </div>
        )}
      </section>

      {/* Stat Cards — shown only when dataset is loaded */}
      {entities && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={FiUsers} label="Total Teams" value={entities.teams.length} detail="Detected in dataset" />
          <StatCard icon={FiUserCheck} label="Total Members" value={entities.members.length} detail="Active contributors" accent="bg-emerald-50 text-emerald-600" />
          <StatCard icon={FiBriefcase} label="Total Projects" value={entities.projects.length} detail="Tracked initiatives" accent="bg-amber-50 text-amber-600" />
          <StatCard icon={FiCheckCircle} label="Completed" value={completed} detail="Delivered successfully" accent="bg-teal-50 text-teal-600" />
          <StatCard icon={FiLayers} label="Ongoing" value={ongoing} detail="Currently in progress" accent="bg-indigo-50 text-indigo-600" />
        </section>
      )}

      {/* Dataset Info — shown when loaded */}
      {activeDataset && (
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-base font-bold text-ink">Dataset Overview</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'File', value: activeDataset.fileName },
              { label: 'Type', value: activeDataset.fileType },
              { label: 'Category', value: activeDataset.metadata?.datasetCategory ?? '—' },
              { label: 'Status', value: activeDataset.status ?? 'Ready' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* No dataset placeholder */}
      {!activeDataset && (
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
          <h2 className="mb-3 text-base font-bold text-ink">Getting Started</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {['1. Upload a CSV, XLSX, or JSON dataset', '2. Explore Teams, Members, and Projects', '3. Ask AI questions about your data'].map((step) => (
              <div key={step} className="rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700">{step}</div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Navigation Bar */}
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-base font-bold text-ink">Quick Navigation</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {quickLinks.map(({ to, label, icon: Icon, accent }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md ${accent}`}
            >
              <Icon className="h-6 w-6" />
              {label}
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
