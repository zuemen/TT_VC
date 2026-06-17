import { useRef } from 'react'
import { useI18n } from '../hooks/useI18n'

const JURISDICTIONS = [
  { value: 'USA', label: '美國' },
  { value: 'Germany', label: '德國' },
  { value: 'Singapore', label: '新加坡' },
  { value: 'UK', label: '英國' },
  { value: 'Taiwan', label: '台灣' },
  { value: 'South Korea', label: '韓國' },
  { value: 'Japan', label: '日本' },
  { value: 'Canada', label: '加拿大' },
  { value: 'Australia', label: '澳洲' },
]

const GOALS = [
  { value: 'University Study', label: '學術申請' },
  { value: 'Employment', label: '就業申請' },
  { value: 'Healthcare License', label: '醫療執照' },
  { value: 'Digital Nomad Visa', label: '數位遊牧簽證' },
  { value: 'Talent Pass', label: '人才通行證' },
  { value: 'Skilled Migration Visa', label: '技術移民簽證' },
  { value: 'Exchange Program', label: '交換計畫' },
  { value: 'Banking Setup', label: '銀行開戶' },
]

const DEMOS = [
  { key: 'Study', title: '學術套件', detail: '3 份文件，學簽流程' },
  { key: 'Career', title: '就業套件', detail: '2 份文件，職涯驗證' },
  { key: 'Taiwan', title: '台灣套件', detail: '政大與銀行證明' },
  { key: 'Korea', title: '韓國套件', detail: '就業與稅務證明' },
]

const STEPS = [
  { id: 'upload', label: '收件' },
  { id: 'process', label: '處理' },
  { id: 'analyze', label: '分析' },
  { id: 'report', label: '報告' },
]

export default function Sidebar({
  jurisdiction,
  setJurisdiction,
  goal,
  setGoal,
  fileLabel,
  onFilesChange,
  onDrop,
  onSubmit,
  onDemo,
  loading,
  activeStep,
}) {
  const { t } = useI18n()
  const inputRef = useRef()
  const stepIndex = STEPS.findIndex((step) => step.id === activeStep)

  return (
    <aside className="space-y-6 xl:col-span-3">
      <section className="glass rounded-[1.75rem] p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-10 w-1.5 rounded-full bg-cyan-400" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
              {t('scenarioSetup')}
            </p>
            <h2 className="mt-1 text-base font-black text-white">
              案件設定
            </h2>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              {t('jurisdiction')}
            </label>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="w-full rounded-2xl border border-white/8 bg-slate-950/90 px-4 py-4 text-sm text-white outline-none transition focus:border-cyan-400/70"
            >
              {JURISDICTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              {t('objective')}
            </label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full rounded-2xl border border-white/8 bg-slate-950/90 px-4 py-4 text-sm text-white outline-none transition focus:border-cyan-400/70"
            >
              {GOALS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="glass rounded-[1.75rem] border-cyan-400/14 bg-gradient-to-b from-cyan-400/10 to-slate-900/80 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300/70">
              {t('secureIntake')}
            </p>
            <h3 className="mt-1 text-base font-black text-white">
              文件上傳
            </h3>
          </div>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            就緒
          </span>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="group cursor-pointer rounded-[1.5rem] border border-dashed border-white/12 bg-slate-950/60 p-6 text-center transition hover:border-cyan-400/60 hover:bg-cyan-400/6"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/6 shadow-inner">
            <svg className="h-7 w-7 text-slate-400 transition group-hover:text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3" />
            </svg>
          </div>
          <p className="text-sm font-bold text-white">
            {fileLabel || t('uploadDocs')}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            {t('uploadHint')}
          </p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.docx,.txt"
            onChange={onFilesChange}
          />
        </div>

        <button
          onClick={onSubmit}
          disabled={loading}
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t('executingBtn') : t('executeBtn')}
        </button>

        {loading && (
          <div className="mt-6 space-y-3">
            {STEPS.map((step, index) => {
              const state = index < stepIndex ? 'done' : index === stepIndex ? 'active' : 'pending'
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${
                      state === 'done'
                        ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300'
                        : state === 'active'
                          ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200'
                          : 'border-white/10 bg-white/4 text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${state === 'pending' ? 'text-slate-500' : 'text-white'}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      {state === 'done' ? '完成' : state === 'active' ? '進行中' : '等待中'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="glass rounded-[1.75rem] p-6">
        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
            {t('instantDemos')}
          </p>
          <h3 className="mt-1 text-base font-black text-white">
            載入範例
          </h3>
        </div>

        <div className="grid gap-3">
          {DEMOS.map((demo) => (
            <button
              key={demo.key}
              type="button"
              onClick={() => onDemo(demo.key)}
              className="group flex items-start gap-4 rounded-[1.25rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/6"
            >
              <span className="mt-1 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white transition group-hover:text-cyan-100">
                  {demo.title}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {demo.detail}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}
