const agentColors = {
  'Team Agent':    'bg-brand-50 text-brand-700',
  'Member Agent':  'bg-emerald-50 text-emerald-700',
  'Project Agent': 'bg-amber-50 text-amber-700',
  'RAG Agent':     'bg-purple-50 text-purple-700',
};

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser ? 'bg-brand-600 text-white' : 'border border-slate-100 bg-white text-slate-700'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}
