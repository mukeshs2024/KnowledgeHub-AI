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
        {!isUser && message.meta ? (
          <div className="mt-3 space-y-1 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
            {message.meta.agent ? <div>Agent Used: {message.meta.agent}</div> : null}
            {message.meta.executionFlow ? <div>Execution Flow: {message.meta.executionFlow}</div> : null}
            {message.meta.confidence ? <div>Confidence Score: {message.meta.confidence}</div> : null}
            {message.meta.sources ? <div>Sources Used: {message.meta.sources}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
