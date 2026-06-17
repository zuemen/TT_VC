import { useI18n } from '../hooks/useI18n'

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export default function ShareBanner({ shareLink, vaultShareLink, result }) {
  const { t } = useI18n()

  const copyAndOpen = () => {
    navigator.clipboard.writeText(shareLink).catch(() => {})
    window.open(shareLink, '_blank', 'noopener,noreferrer')
  }

  const printPassport = () => {
    if (!result) return

    const { trust_info: trust, analysis } = result
    const adv = trust?.advantage ?? {}
    const popup = window.open('', '_blank')
    popup.document.write(`<!DOCTYPE html><html><head><title>信任護照 - Global TrustDrive</title><style>
      body{font-family:Inter,Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 40px;color:#0f172a;background:#fff}
      .top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:18px;margin-bottom:24px}
      h1{margin:0;font-size:26px;letter-spacing:-0.03em}
      .sub{margin-top:6px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#64748b}
      .score{font-size:72px;font-weight:900;line-height:1;color:#0369a1;text-align:right}
      .level{display:inline-block;margin-top:8px;padding:4px 12px;border-radius:999px;background:#0f172a;color:#fff;font-size:11px;font-weight:700}
      h2{margin:24px 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:.18em;color:#0369a1}
      pre{white-space:pre-wrap;font-family:inherit;line-height:1.7;font-size:13px;color:#334155}
      .footer{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8}
      @media print{button{display:none}}
    </style></head><body>
      <div class="top">
        <div>
          <h1>GLOBAL TRUSTDRIVE</h1>
          <div class="sub">信任護照 - AI 原生憑證證書</div>
        </div>
        <div>
          <div class="score">${esc(trust?.score)}</div>
          <div class="level">${esc(trust?.level)}</div>
        </div>
      </div>
      <h2>身分保證</h2>
      <p>IAL: ${esc(trust?.ial)} &nbsp;|&nbsp; Standard: ${esc(analysis?.standard_info?.name)} (${esc(analysis?.standard_info?.code)})</p>
      <p>${'★'.repeat(adv.stars ?? 0)}${'☆'.repeat(5 - (adv.stars ?? 0))}</p>
      <p>${esc(adv.analysis)}</p>
      <h2>AI 分析</h2>
      <pre>${esc(analysis?.advantage_analysis)}</pre>
      <h2>指標</h2>
      <p><strong>${esc(analysis?.converted_metrics?.val)}</strong> | ${esc(analysis?.converted_metrics?.system)}</p>
      <p>${esc(analysis?.converted_metrics?.detail)}</p>
      <div class="footer">
        產生時間：${new Date().toISOString()} | 文件 ID：${esc(analysis?.doc_id)}<br>
        Global TrustDrive - 僅供參考，仍需正式驗證。
      </div>
      <script>setTimeout(()=>window.print(),300)</script>
    </body></html>`)
    popup.document.close()
  }

  return (
    <section className="glass rounded-[1.75rem] p-5 md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
            分享
          </p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white">
            可分享報告已就緒
          </h3>
          <p className="mt-2 truncate text-sm text-cyan-300/80">
            {shareLink}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={printPassport}
            className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-400/15"
          >
            {t('trustPassport')}
          </button>
          <button
            onClick={copyAndOpen}
            className="rounded-2xl bg-cyan-400 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300"
          >
            {t('openViewer')}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.25rem] border border-white/6 bg-white/[0.03] px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">分享模式</p>
          <p className="mt-2 text-sm font-bold text-white">SmartDrop 檢視器</p>
        </div>
        <div className="rounded-[1.25rem] border border-white/6 bg-white/[0.03] px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">文件 ID</p>
          <p className="mt-2 truncate text-sm font-bold text-white">{result?.analysis?.doc_id ?? '--'}</p>
        </div>
        <div className="rounded-[1.25rem] border border-white/6 bg-white/[0.03] px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">保管庫連結</p>
          <p className="mt-2 truncate text-sm font-bold text-white">{vaultShareLink || '無法使用'}</p>
        </div>
      </div>

      {vaultShareLink && (
        <div className="mt-5 rounded-[1.25rem] border border-cyan-400/14 bg-cyan-400/6 px-4 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/80">
            原生分享網址
          </p>
          <a
            href={vaultShareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block truncate text-sm font-bold text-cyan-200 hover:underline"
          >
            {vaultShareLink}
          </a>
        </div>
      )}
    </section>
  )
}
