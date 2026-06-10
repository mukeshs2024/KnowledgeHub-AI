import { FiActivity, FiClock, FiDatabase, FiSearch, FiShield, FiTrendingUp } from 'react-icons/fi';
import StatCard from '../components/StatCard.jsx';
import { useDataset } from '../data/DatasetContext.jsx';

const icons = [FiDatabase, FiSearch, FiClock, FiTrendingUp, FiActivity, FiShield];
const accents = [
  'bg-brand-50 text-brand-600',
  'bg-emerald-50 text-emerald-600',
  'bg-amber-50 text-amber-600',
  'bg-indigo-50 text-indigo-600',
  'bg-rose-50 text-rose-600',
  'bg-cyan-50 text-cyan-600',
];

export default function Analytics() {
  const { dataset } = useDataset();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Statistics generated dynamically from inferred numeric, categorical, and date fields.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dataset.analytics.map((item, index) => (
          <StatCard key={item.label} icon={icons[index]} label={item.label} value={item.value} detail={item.detail} accent={accents[index]} />
        ))}
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-bold text-ink">Column Decisions</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {['number', 'text', 'date'].map((type) => (
            <div key={type} className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{type}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {dataset.columns.filter((column) => column.type === type).map((column) => column.label).join(', ') || 'None detected'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
