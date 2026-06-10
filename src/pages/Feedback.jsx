import { useState } from 'react';
import { FiMessageCircle, FiStar, FiCheckCircle, FiClock } from 'react-icons/fi';
import FeedbackForm from '../components/FeedbackForm.jsx';
import FeedbackCard from '../components/FeedbackCard.jsx';
import StatCard from '../components/StatCard.jsx';

const MOCK_FEEDBACK = [
  { id: 1, name: 'Arjun Sharma', email: 'arjun@example.com', category: 'UI/UX', rating: 5, message: 'The dashboard layout is clean and very intuitive. Loved the analytics section!', date: '12/07/2025' },
  { id: 2, name: 'Priya Nair', email: 'priya@example.com', category: 'Feature Request', rating: 4, message: 'Would love to see export functionality for project reports in PDF format.', date: '11/07/2025' },
  { id: 3, name: 'Karan Mehta', email: 'karan@example.com', category: 'Bug Report', rating: 3, message: 'Search bar sometimes does not filter correctly on mobile devices.', date: '10/07/2025' },
];

function Toast({ message, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-emerald-600 px-5 py-3.5 text-white shadow-lg animate-fade-in">
      <FiCheckCircle className="h-5 w-5 shrink-0" />
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 text-white/80 hover:text-white text-lg leading-none">&times;</button>
    </div>
  );
}

export default function Feedback() {
  const [feedbackList, setFeedbackList] = useState(MOCK_FEEDBACK);
  const [toast, setToast] = useState(false);

  const handleSubmit = (entry) => {
    setFeedbackList((prev) => [entry, ...prev]);
    setToast(true);
    setTimeout(() => setToast(false), 3500);
  };

  const avgRating = feedbackList.length
    ? (feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length).toFixed(1)
    : '0.0';

  const openRequests = feedbackList.filter((f) => f.category === 'Feature Request' || f.category === 'Bug Report').length;
  const resolved = feedbackList.filter((f) => f.rating >= 4).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink">User Feedback</h1>
        <p className="text-sm text-slate-500">Submit and review feedback from the team.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FiMessageCircle} label="Total Feedback" value={feedbackList.length} detail="All submissions" />
        <StatCard icon={FiStar} label="Average Rating" value={avgRating} detail="Out of 5 stars" accent="bg-amber-50 text-amber-600" />
        <StatCard icon={FiClock} label="Open Requests" value={openRequests} detail="Bugs & feature requests" accent="bg-rose-50 text-rose-600" />
        <StatCard icon={FiCheckCircle} label="Resolved" value={resolved} detail="Rated 4 stars or above" accent="bg-emerald-50 text-emerald-600" />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
          <h2 className="mb-4 text-base font-bold text-ink">Submit Feedback</h2>
          <FeedbackForm onSubmit={handleSubmit} />
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
          <h2 className="mb-1 text-base font-bold text-ink">Recent Feedback</h2>
          <p className="mb-3 text-xs text-slate-500">{feedbackList.length} total submissions</p>
          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-1">
            {feedbackList.map((f) => (
              <FeedbackCard key={f.id} feedback={f} />
            ))}
          </div>
        </section>
      </div>

      {toast && <Toast message="Feedback submitted successfully!" onClose={() => setToast(false)} />}
    </div>
  );
}
