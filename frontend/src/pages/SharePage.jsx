import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

function ChatBubble({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-cyan-400 px-4 py-3 text-sm font-medium text-slate-950">
          {msg.text}
        </div>
      </div>
    )
  }

  if (msg.role === 'error') {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-950/40 px-4 py-3 text-sm text-red-300">
        {msg.text}
      </div>
    )
  }

  return (
    <div className="max-w-[90%] rounded-2xl rounded-tl-md border border-white/6 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-slate-200">
      {msg.text}
    </div>
  )
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-[1.25rem] border border-white/6 bg-white/[0.03] px-4 py-4">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-black tracking-tight text-white">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs leading-6 text-slate-500">{hint}</p>}
    </div>
  )
}

const COUNTRY_LABELS = {
  USA: '美國',
  Germany: '德國',
  Singapore: '新加坡',
  UK: '英國',
  Taiwan: '台灣',
  'South Korea': '韓國',
  Japan: '日本',
  Canada: '加拿大',
  Australia: '澳洲',
}

const GOAL_LABELS = {
  'University Study': '學術申請',
  Employment: '就業申請',
  'Healthcare License': '醫療執照',
  'Digital Nomad Visa': '數位遊牧簽證',
  'Talent Pass': '人才通行證',
  'Skilled Migration Visa': '技術移民簽證',
  'Exchange Program': '交換計畫',
  'Banking Setup': '銀行開戶',
}

export default function SharePage() {
  const { docId } = useParams()
  const [docData, setDocData] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: '這份共享報告已就緒。你可以詢問合規、缺件或下一步。',
    },
  ])
  const [input, setInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const chatBoxRef = useRef()

  useEffect(() => {
    fetch(`/api/share-data/${docId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setDocData(data.data)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
  }, [docId])

  useEffect(() => {
    if (!docData?.created_at) return

    const tick = () => {
      const expiry = (docData.created_at + 7 * 24 * 3600) * 1000
      const remaining = expiry - Date.now()
      if (remaining <= 0) {
        setTimeLeft('已過期')
        return
      }
      const days = Math.floor(remaining / 86400000)
      const hours = Math.floor((remaining % 86400000) / 3600000)
      setTimeLeft(`剩餘 ${days} 天 ${hours} 小時`)
    }

    tick()
    const timer = setInterval(tick, 60000)
    return () => clearInterval(timer)
  }, [docData])

  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const analysis = docData?.analysis ?? {}
  const trust = docData?.trust_info ?? {}
  const advantage = trust.advantage ?? {}
  const metrics = analysis.converted_metrics ?? {}
  const stdInfo = analysis.standard_info ?? {}
  const redacted = useMemo(
    () => (analysis.redacted_credentials ?? []).map((item) => `[文件：${item.name}]\n${item.content}`).join('\n\n---\n\n'),
    [analysis.redacted_credentials],
  )
  const stars = Math.max(0, Math.min(5, advantage.stars ?? 0))
  const displayGoal = GOAL_LABELS[docData.goal] ?? docData.goal
  const displayCountry = COUNTRY_LABELS[docData.target_country] ?? docData.target_country

  const sendChat = async (e) => {
    e.preventDefault()
    const message = input.trim()
    if (!message || chatBusy) return

    setMessages((prev) => [...prev, { role: 'user', text: message }])
    setInput('')
    setChatBusy(true)
    setMessages((prev) => [...prev, { role: 'ai', text: '思考中…' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id: docId, message }),
      })
      const data = await res.json()
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = data.success
          ? { role: 'ai', text: data.response }
          : { role: 'error', text: data.detail || data.error || '錯誤' }
        return next
      })
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = { role: 'error', text: '網路錯誤：' + err.message }
        return next
      })
    } finally {
      setChatBusy(false)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10">
        <div className="mx-auto grid min-h-[70vh] max-w-lg place-items-center">
          <div className="rounded-[2rem] border border-white/6 bg-slate-900/80 p-10 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86l-7.2 12A2 2 0 004.8 19h14.4a2 2 0 001.71-3.14l-7.2-12a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
              找不到文件
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              這個 SmartDrop 連結可能無效、已過期，或已從系統移除。
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!docData) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10">
        <div className="mx-auto flex min-h-[70vh] items-center justify-center gap-3 text-cyan-300">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
          <span className="text-sm font-black uppercase tracking-[0.24em]">載入報告中</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-cyan-500/8 blur-[120px]" />
        <div className="absolute right-[-8%] top-[10%] h-[32%] w-[32%] rounded-full bg-blue-600/8 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/6 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
              SmartDrop 檢視器
            </p>
            <h1 className="mt-1 truncate text-lg font-black tracking-tight text-white md:text-2xl">
              {analysis.doc_id || '共享報告'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {timeLeft && (
              <span className="hidden rounded-full border border-white/6 bg-white/[0.03] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 md:inline-flex">
                {timeLeft}
              </span>
            )}
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              共享中
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 px-4 py-6 md:px-8 xl:grid-cols-12">
        <section className="space-y-6 xl:col-span-8">
          <div className="rounded-[2rem] border border-white/6 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300/70">
                  公開報告
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
                  {displayGoal} / {displayCountry}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
                  檢視憑證摘要、審閱去識別證據，並向 AI 助理詢問下一步建議。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard label="信任分數" value={trust.score ?? '--'} hint={trust.level ?? '待定'} />
                <StatCard label="IAL" value={trust.ial ?? '--'} hint={stdInfo.code ?? 'N/A'} />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/6 bg-white/[0.03] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
                {displayCountry}
              </span>
              <span className="rounded-full border border-white/6 bg-white/[0.03] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
                {displayGoal}
              </span>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
                {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/6 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                標準化指標
              </p>
              <div className="mt-4 rounded-[1.5rem] border border-white/6 bg-white/[0.03] p-5">
                <p className="text-4xl font-black tracking-tight text-white">
                  {metrics.val ?? '--'}
                </p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200">
                  {metrics.system ?? '待定'}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {metrics.detail ?? '目前沒有指標細節。'}
                </p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/6 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                結論摘要
              </p>
              <div className="mt-4 rounded-[1.5rem] border border-white/6 bg-white/[0.03] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  {trust.level ?? '待定'}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {advantage.analysis ?? '等待評估。'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/6 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  去識別證據
                </p>
                <h3 className="mt-2 text-xl font-black text-white">
                  AI 報告摘要
                </h3>
              </div>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                已去識別
              </span>
            </div>
            <pre className="mt-5 max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-[1.5rem] border border-white/6 bg-slate-950/70 p-5 text-[11px] leading-7 text-slate-400">
              {redacted || '目前沒有可顯示的去識別內容。'}
            </pre>
          </div>

          <div className="rounded-[1.75rem] border border-white/6 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  驗證
                </p>
                <h3 className="mt-2 text-xl font-black text-white">
                  掃描或複製公開連結
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  這個 QR Code 會直接指向此報告網址，方便外部檢視。
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/6 bg-white p-4">
                <QRCodeSVG
                  value={window.location.href}
                  size={112}
                  fgColor="#0f172a"
                  bgColor="#ffffff"
                  level="M"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="min-w-0 flex-1 rounded-[1.25rem] border border-white/6 bg-white/[0.03] px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                  分享連結
                </p>
                <p className="mt-2 truncate text-sm font-bold text-cyan-200">
                  {window.location.href}
                </p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/[0.06]"
              >
                複製連結
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:col-span-4 xl:self-start">
          <div className="rounded-[1.75rem] border border-white/6 bg-slate-900/75 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  助理
                </p>
                <h3 className="mt-2 text-lg font-black text-white">
                  詢問報告
                </h3>
              </div>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                線上
              </span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              可詢問缺件、政策落差，或接下來該提交什麼。
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/6 bg-slate-900/75 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="border-b border-white/6 px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                對話
              </p>
            </div>

            <div ref={chatBoxRef} className="max-h-[56vh] space-y-3 overflow-y-auto px-5 py-5">
              {messages.map((message, index) => (
                <ChatBubble key={index} msg={message} />
              ))}
            </div>

            <form onSubmit={sendChat} className="border-t border-white/6 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={chatBusy}
                  placeholder="詢問這份報告..."
                  className="min-w-0 flex-1 rounded-2xl border border-white/8 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70"
                />
                <button
                  type="submit"
                  disabled={chatBusy || !input.trim()}
                  className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chatBusy ? '...' : '送出'}
                </button>
              </div>
            </form>
          </div>
        </aside>
      </main>
    </div>
  )
}
