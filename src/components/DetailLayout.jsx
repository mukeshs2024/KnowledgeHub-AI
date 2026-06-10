import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

export function DetailPage({ title, subtitle, children }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-ink"
        >
          <FiArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function DetailCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
      {title && <h2 className="mb-4 text-base font-bold text-ink">{title}</h2>}
      {children}
    </div>
  );
}

export function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:gap-8 border-b border-slate-100 last:border-0">
      <dt className="w-40 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value || '—'}</dd>
    </div>
  );
}

export function TagList({ items }) {
  if (!items?.length) return <p className="text-sm text-slate-400">—</p>;
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {items.map((item) => (
        <span key={item} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
          {item}
        </span>
      ))}
    </div>
  );
}

const statusStyles = {
  Completed: 'bg-emerald-50 text-emerald-700',
  Ongoing: 'bg-blue-50 text-blue-700',
  Planning: 'bg-amber-50 text-amber-700',
  Active: 'bg-blue-50 text-blue-700',
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}
