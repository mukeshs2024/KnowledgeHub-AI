import { FiStar } from 'react-icons/fi';

export default function FeedbackCard({ feedback }) {
  const { name, rating, category, date, message } = feedback;
  return (
    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-800 text-sm">{name}</p>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{category}</span>
        </div>
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{message}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <FiStar
              key={s}
              className={`h-3.5 w-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
            />
          ))}
        </div>
        <span className="text-xs text-slate-400">{date}</span>
      </div>
    </div>
  );
}
