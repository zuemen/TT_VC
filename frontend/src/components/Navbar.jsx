import { useI18n } from '../hooks/useI18n'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: 'ZH' },
  { code: 'ko', label: 'KO' },
]

const TABS = [
  { label: '總覽', active: true },
  { label: '案件', active: false },
  { label: '稽核軌跡', active: false },
  { label: '網路', active: false },
]

export default function Navbar() {
  const { lang, setLang, t } = useI18n()

  return (
    <header className="sticky top-0 z-50 border-b border-white/6 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-base font-black tracking-tight text-white md:text-xl">
                {t('brandName')}
              </h1>
              <span className="hidden rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300 md:inline-flex">
                在線
              </span>
            </div>
            <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
              {t('brandSub')}
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-white/6 bg-white/4 p-1 xl:flex">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                tab.active
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:bg-white/6 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 md:flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
              {t('navStatus')}
            </span>
          </div>

          <div className="flex rounded-full border border-white/8 bg-slate-900/90 p-1">
            {LANGS.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLang(item.code)}
                className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition ${
                  lang === item.code
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
