import { useEffect, useMemo, useState } from 'react';
import { FiSend, FiTrash2 } from 'react-icons/fi';
import ChatMessage from './ChatMessage.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import { useDataset } from '../data/DatasetContext.jsx';
import { runCoordinator } from '../agents/coordinatorAgent.js';
import { parseUploadedFile } from '../data/dataset.js';

const DEFAULT_QUESTIONS = [
  'Show all teams',
  'List all members',
  'Show all projects',
  'How many completed projects?',
  'Show project status distribution',
];

export default function ChatWindow() {
  const { activeDataset, setActiveDataset } = useDataset();
  const [builtinDataset, setBuiltinDataset] = useState(null);

  // Auto-load the built-in CSV so AI always has data
  useEffect(() => {
    if (activeDataset || builtinDataset) return;
    import('../data/Rag_Project_Dataset.csv?raw')
      .then(({ default: csvText }) => {
        const file = new File([csvText], 'Rag_Project_Dataset.csv', { type: 'text/csv' });
        return parseUploadedFile(file);
      })
      .then((ds) => setBuiltinDataset(ds))
      .catch(() => {});
  }, [activeDataset, builtinDataset]);

  const dataset = activeDataset ?? builtinDataset;

  const starterMessages = useMemo(() => [
    {
      id: 1,
      role: 'assistant',
      text: dataset
        ? `Hi! I'm KnowledgeHub AI. I have full access to ${dataset.fileName} with ${dataset.rows.length} records.\n\nYou can ask me about teams, members, projects, analytics, or anything from the dataset.`
        : `Hi! I'm KnowledgeHub AI. Loading dataset...`,
    },
  ], [dataset?.fileName, dataset?.rows?.length]);

  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMessages(starterMessages);
  }, [starterMessages]);

  const history = useMemo(() => messages.filter((m) => m.role === 'user'), [messages]);

  const submitMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    if (!dataset) {
      setMessages((cur) => [...cur, { id: Date.now(), role: 'user', text: trimmed }, { id: Date.now() + 1, role: 'assistant', text: 'Still loading the dataset, please try again in a moment.' }]);
      return;
    }

    const userMessage = { id: Date.now(), role: 'user', text: trimmed };
    setMessages((cur) => [...cur, userMessage]);
    setInput('');
    setIsTyping(true);

    (async () => {
      try {
        const result = await runCoordinator(dataset, trimmed);
        setMessages((cur) => [
          ...cur,
          { id: Date.now() + 1, role: 'assistant', text: result.text, meta: result.meta },
        ]);
      } finally {
        setIsTyping(false);
      }
    })();
  };

  const suggestedQuestions = dataset?.metadata?.possibleQuestions ?? DEFAULT_QUESTIONS;
  const subtitle = dataset
    ? `Agentic RAG over ${dataset.rows.length.toLocaleString()} records · ${dataset.fileName}`
    : 'Loading KnowledgeHub dataset...';

  return (
    <div className="grid min-h-[680px] gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Chat History</h2>
          <button
            type="button"
            onClick={() => setMessages(starterMessages)}
            className="focus-ring rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-rose-600"
            title="Clear chat"
          >
            <FiTrash2 />
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {history.length ? (
            history.map((message) => (
              <button
                key={message.id}
                type="button"
                onClick={() => submitMessage(message.text)}
                className="w-full rounded-xl bg-slate-50 px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
              >
                {message.text}
              </button>
            ))
          ) : (
            <p className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">No previous questions yet.</p>
          )}
        </div>
      </aside>

      <section className="flex min-h-[680px] flex-col rounded-2xl border border-slate-100 bg-slate-50 shadow-soft">
        <div className="border-b border-slate-200 bg-white px-5 py-4">
          <h1 className="text-xl font-bold text-ink">Ask AI</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <LoadingSpinner />
              Assistant is retrieving relevant records
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestedQuestions.map((query) => (
              <button
                key={query}
                type="button"
                onClick={() => submitMessage(query)}
                className="focus-ring rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                {query}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); submitMessage(input); }}
            className="flex gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about teams, members, projects..."
              className="focus-ring h-12 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm shadow-sm"
            />
            <button
              type="submit"
              className="focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700"
              title="Send message"
            >
              <FiSend />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
