import { useState } from 'react';
import { FiStar } from 'react-icons/fi';

const CATEGORIES = ['UI/UX', 'Bug Report', 'Feature Request', 'Performance', 'General Feedback'];

const EMPTY = { name: '', email: '', category: '', rating: 0, message: '' };

export default function FeedbackForm({ onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [hover, setHover] = useState(0);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.rating) return;
    onSubmit({ ...form, id: Date.now(), date: new Date().toLocaleDateString() });
    setForm(EMPTY);
    setHover(0);
  };

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Name</label>
          <input required className={inputCls} placeholder="Your name" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Email</label>
          <input required type="email" className={inputCls} placeholder="you@example.com" value={form.email} onChange={set('email')} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">Category</label>
        <select required className={inputCls} value={form.category} onChange={set('category')}>
          <option value="">Select a category</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="text-2xl transition-transform hover:scale-110 focus:outline-none"
            >
              <FiStar
                className={`h-7 w-7 transition ${
                  star <= (hover || form.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">Feedback</label>
        <textarea
          required
          rows={4}
          className={inputCls + ' resize-none'}
          placeholder="Share your thoughts..."
          value={form.message}
          onChange={set('message')}
        />
      </div>

      <button
        type="submit"
        className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        Submit Feedback
      </button>
    </form>
  );
}
