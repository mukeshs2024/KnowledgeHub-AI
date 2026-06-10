import { useEffect, useMemo, useState } from 'react';
import { FiSend, FiTrash2 } from 'react-icons/fi';
import ChatMessage from './ChatMessage.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import { useDataset } from '../data/DatasetContext.jsx';
import { answerQuestion } from '../data/dataset.js';
import { buildPrompt, callGemini } from '../lib/gemini.js';

export default function ChatWindow() {
  const { activeDataset } = useDataset();
  const starterMessages = useMemo(
    () =>
      activeDataset
        ? [
            {
              id: 1,
              role: 'assistant',
              text: `Hi, I analyzed ${activeDataset.fileName}. Ask about counts, averages, highest values, categories, or row-level detail from the uploaded dataset.`,
            },
          ]
        : [],
    [activeDataset]
  );
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMessages(starterMessages);
  }, [starterMessages]);

  const history = useMemo(() => messages.filter((message) => message.role === 'user'), [messages]);

  const submitMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping || !activeDataset) return;

    const userMessage = { id: Date.now(), role: 'user', text: trimmed };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsTyping(true);

    (async () => {
      try {
        // simple retrieval: score documents by token overlap
        const qtokens = String(trimmed).toLowerCase().match(/[a-z0-9]+/g) ?? [];
        const scored = activeDataset.documents
          .map((doc) => {
            const text = `${doc.text} ${Object.values(doc.metadata).join(' ')}`.toLowerCase();
            const score = qtokens.reduce((s, t) => s + (text.includes(t) ? 1 : 0), 0);
            return { doc, score };
          })
          .filter((d) => d.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((d) => d.doc);

        const { prompt } = buildPrompt(activeDataset, trimmed, scored);
        let llmText;
        try {
          llmText = await callGemini(prompt, { maxTokens: 512, temperature: 0.0 });
        } catch (err) {
          // Fall back to local heuristic responder
          const response = answerQuestion(activeDataset, trimmed);
          llmText = `${response.text}\n\nSource: ${response.sources ?? 'Dataset'}`;
        }

        setMessages((current) => [
          ...current,
          {
            id: Date.now() + 1,
            role: 'assistant',
            text: llmText,
            meta: {
              agent: 'Gemini',
              sources: scored.length ? `Retrieved ${scored.length} rows` : 'Dataset',
              confidence: scored.length ? 'High' : 'Low',
            },
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    })();
  };

  if (!activeDataset) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-10 shadow-soft">
        <h1 className="text-2xl font-bold text-ink">Ask AI</h1>
        <p className="mt-3 text-sm text-slate-500">Upload a dataset to start asking questions.</p>
        <p className="mt-4 text-sm text-slate-600">Supported formats: CSV, XLSX, JSON.</p>
      </div>
    );
  }

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
          <p className="mt-1 text-sm text-slate-500">Schema-aware retrieval over {activeDataset.rows.length.toLocaleString()} records from {activeDataset.fileName}.</p>
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
            {activeDataset.metadata.possibleQuestions.map((query) => (
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
            onSubmit={(event) => {
              event.preventDefault();
              submitMessage(input);
            }}
            className="flex gap-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask anything about the uploaded dataset"
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
