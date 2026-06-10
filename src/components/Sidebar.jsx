import { NavLink } from 'react-router-dom';
import { FiDatabase, FiFileText, FiHome, FiMessageSquare, FiX } from 'react-icons/fi';
import { useDataset } from '../data/DatasetContext.jsx';

export default function Sidebar({ isOpen, onClose }) {
  const { activeDataset } = useDataset();

  const links = [
    { to: '/', label: 'Dashboard', icon: FiHome },
    ...(activeDataset
      ? [
          { to: '/ask-ai', label: 'Ask AI', icon: FiMessageSquare },
          { to: '/teams', label: 'Details', icon: FiDatabase },
          { to: '/projects', label: 'Documents', icon: FiFileText },
        ]
      : []),
    
  ];

  const panel = (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-white px-4 py-5">
      <div className="flex items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-lg font-black text-white">UK</span>
          <div>
            <p className="text-sm font-bold text-ink">Universal Knowledge</p>
            <p className="text-xs text-slate-500">Assistant</p>
          </div>
        </div>
        <button type="button" className="focus-ring rounded-lg p-2 text-slate-500 lg:hidden" onClick={onClose} title="Close menu">
          <FiX />
        </button>
      </div>

      <nav className="mt-8 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
              }`
            }
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-ink">KnowledgeHub AI</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Team and project intelligence from your uploaded dataset.</p>
      </div>
    </aside>
  );

  return (
    <>
      <div className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">{panel}</div>
      {isOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-label="Close menu" />
          <div className="relative h-full w-72 max-w-[86vw] shadow-2xl">{panel}</div>
        </div>
      ) : null}
    </>
  );
}
