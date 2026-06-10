import { FiKey, FiSave, FiUser } from 'react-icons/fi';

export default function Settings() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Profile, theme, and model key interface only.</p>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <FiUser />
            </span>
            <div>
              <h2 className="font-bold text-ink">Profile</h2>
              <p className="text-sm text-slate-500">Workspace display details</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Name
              <input defaultValue="Knowledge Admin" className="focus-ring h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal shadow-sm" />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Role
              <input defaultValue="Dataset Analyst" className="focus-ring h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal shadow-sm" />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
          <h2 className="font-bold text-ink">Theme</h2>
          <p className="mt-1 text-sm text-slate-500">Toggle UI only. Light mode stays active by default.</p>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="font-semibold text-slate-800">Light Mode</p>
              <p className="text-sm text-slate-500">Clean dashboard palette</p>
            </div>
            <button type="button" className="focus-ring flex h-7 w-12 items-center rounded-full bg-brand-600 p-1 transition">
              <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <FiKey />
          </span>
          <div>
            <h2 className="font-bold text-ink">Gemini API Key</h2>
            <p className="text-sm text-slate-500">Frontend-only input. No key is submitted from this demo.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input type="password" defaultValue="gemini-api-key-placeholder" className="focus-ring h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm shadow-sm" />
          <button type="button" className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700">
            <FiSave />
            Save
          </button>
        </div>
      </section>
    </div>
  );
}
