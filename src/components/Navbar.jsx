import { FiBell, FiMenu, FiSearch } from 'react-icons/fi';

export default function Navbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button type="button" className="focus-ring rounded-xl p-2 text-slate-600 lg:hidden" onClick={onMenuClick} title="Open menu">
            <FiMenu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-sm text-slate-500">Workspace</p>
          <h1 className="text-base font-bold text-ink sm:text-lg">KnowledgeHub AI: Team & Project Intelligence Assistant</h1>
          </div>
        </div>

        <div className="hidden min-w-0 max-w-md flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:flex">
          <FiSearch className="mr-2 h-4 w-4" />
          Search uploaded knowledge
        </div>

        <div className="flex items-center gap-3">
          <button type="button" className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50" title="Notifications">
            <FiBell />
          </button>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white">AI</div>
        </div>
      </div>
    </header>
  );
}
