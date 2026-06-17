import { useState } from 'react'
import { useI18n } from '../hooks/useI18n'

function GapText({ text }) {
  const sections = []
  let currentTitle = ''
  let currentLines = []

  String(text ?? '')
    .split('\n')
    .forEach((line, index) => {
      if (line.startsWith('## ')) {
        if (currentTitle || currentLines.length) {
          sections.push({ title: currentTitle, lines: [...currentLines], id: index })
        }
        currentTitle = line.replace('## ', '')
        currentLines = []
        return
      }

      if (line.trim()) currentLines.push(line)
    })

  if (currentTitle || currentLines.length) {
    sections.push({ title: currentTitle, lines: currentLines, id: 9999 })
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.id}>
          <h4 className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">
            {section.title || '區段'}
          </h4>
          <div className="space-y-2 pl-2">
            {section.lines.map((line, index) => (
              <p key={index} className="text-sm leading-7 text-slate-300">
                {line}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function GapAdvisor({ docId }) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [gapText, setGapText] = useState('')
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true)
    setError('')
    setGapText('')

    try {
      const res = await fetch('/api/gap-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id: docId }),
      })
      const data = await res.json()
      if (data.success) setGapText(data.gaps)
      else setError(data.detail || data.error || '未知錯誤')
    } catch (e) {
      setError('網路錯誤：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="glass rounded-[1.75rem] border-amber-400/14 bg-gradient-to-b from-amber-400/10 to-slate-900/80 p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-amber-200/70">
            {t('gapTitle')}
          </p>
          <h3 className="mt-2 text-xl font-black text-white">
            缺件分析
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
            產生精簡缺件報告，列出最可能缺少的文件、處理優先順序與後續建議。
          </p>
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="rounded-2xl bg-amber-400 px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t('gapRunning') : t('gapBtn')}
        </button>
      </div>

      {loading && (
        <div className="mt-5 flex items-center gap-3 text-amber-200">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-200 border-t-transparent" />
          <span className="text-sm">{t('gapRunning')}</span>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-[1.25rem] border border-red-500/20 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {gapText && !loading && (
        <div className="mt-5 rounded-[1.5rem] border border-white/6 bg-slate-950/60 p-6">
          <GapText text={gapText} />
        </div>
      )}
    </section>
  )
}
