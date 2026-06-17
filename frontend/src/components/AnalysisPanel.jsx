import { useI18n } from '../hooks/useI18n'

function MetricCard({ label, value, hint, accent = 'text-white', border = 'border-white/6' }) {
  return (
    <div className={`rounded-[1.5rem] border ${border} bg-white/[0.03] p-5`}>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-black tracking-tight ${accent}`}>
        {value}
      </p>
      {hint && (
        <p className="mt-2 text-xs leading-6 text-slate-500">
          {hint}
        </p>
      )}
    </div>
  )
}

export default function AnalysisPanel({ result }) {
  const { t } = useI18n()

  const trust = result?.trust_info ?? {}
  const analysis = result?.analysis ?? {}
  const advantage = trust.advantage ?? {}

  const score = trust.score ?? '--'
  const level = trust.level ?? t('evalPending')
  const ial = trust.ial ?? 'IAL 0'
  const stars = Math.max(0, Math.min(5, advantage.stars ?? 0))
  const metrics = analysis.converted_metrics ?? {
    val: '--',
    system: '待定',
    detail: '分析完成後會顯示更詳細的指標。',
  }
  const stdInfo = analysis.standard_info ?? { code: 'N/A' }
  const redacted = (analysis.redacted_credentials ?? [])
    .map((item) => `[文件：${item.name}]\n${item.content}`)
    .join('\n\n---\n\n')

  return (
    <aside className="space-y-6 lg:col-span-5">
      <section className="glass rounded-[1.75rem] border-cyan-400/14 bg-gradient-to-b from-cyan-400/10 to-slate-900/80 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300/70">
              {t('trustIndex')}
            </p>
            <h3 className="mt-2 text-lg font-black text-white">
              信任分數
            </h3>
          </div>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            {ial}
          </span>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="rounded-[1.5rem] border border-white/6 bg-slate-950/70 p-5">
            <div className="flex items-end gap-4">
              <span className="text-6xl font-black tracking-tight text-white tabular-nums">
                {score}
              </span>
              <div className="pb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                  {level}
                </p>
                <div className="mt-3 h-2.5 w-64 max-w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 transition-all duration-700"
                    style={{ width: `${typeof score === 'number' ? score : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard
              label="通過機率"
              value={`${stars}/5`}
              hint={advantage.analysis ?? '模型產生的信心摘要。'}
              accent="text-cyan-200"
              border="border-cyan-400/12"
            />
            <MetricCard
              label="身分保證"
              value={ial}
              hint={`標準代碼：${stdInfo.code}`}
              accent="text-emerald-200"
              border="border-emerald-400/12"
            />
          </div>
        </div>
      </section>

      <section className="glass rounded-[1.75rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
              {t('approvalProb')}
            </p>
            <h3 className="mt-2 text-lg font-black text-white">
              結論訊號
            </h3>
          </div>
          <div className="text-3xl tracking-[0.18em] text-amber-300">
            {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          {advantage.analysis ?? '等待評估。'}
        </p>
      </section>

      <section className="glass rounded-[1.75rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
              {t('aiReport')}
            </p>
            <h3 className="mt-2 text-lg font-black text-white">
              標準化報告
            </h3>
          </div>
          <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            {stdInfo.code}
          </span>
        </div>

        <div className="mt-5 grid gap-4">
          <MetricCard
            label="轉換指標"
            value={metrics.val}
            hint={metrics.system}
            accent="text-white"
          />

          <div className="rounded-[1.5rem] border border-white/6 bg-slate-950/70 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              證據摘要
            </p>
            <pre className="mt-4 max-h-[220px] overflow-y-auto whitespace-pre-wrap text-[11px] leading-7 text-slate-400">
              {redacted || '目前沒有可顯示的去識別證據。'}
            </pre>
          </div>
        </div>
      </section>
    </aside>
  )
}
