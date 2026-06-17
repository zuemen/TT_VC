import { useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import DocumentViewer from '../components/DocumentViewer'
import AnalysisPanel from '../components/AnalysisPanel'
import GapAdvisor from '../components/GapAdvisor'
import ShareBanner from '../components/ShareBanner'

const FALLBACK_IMG = 'https://cdn.pixabay.com/photo/2013/07/12/15/20/document-149692_1280.png'

const DEMO_DATA = {
  Study: {
    goal: 'University Study',
    country: 'Germany',
    docs: [
      {
        name: 'Academic_Transcript.pdf',
        img: 'https://cdn.pixabay.com/photo/2013/07/12/15/20/document-149692_1280.png',
        content: 'Student: Michael Chen. GPA: 3.8/4.0. 128 credits in Computer Science. Issuer: National University of Technology.',
      },
      {
        name: 'Degree_Certificate.pdf',
        img: 'https://cdn.pixabay.com/photo/2012/04/18/22/07/certificate-38036_1280.png',
        content: 'Degree: Bachelor of Science in Computer Science. Issued: 2024-06. Conferred by: National University of Technology.',
      },
      {
        name: 'Bank_Statement.pdf',
        img: 'https://cdn.pixabay.com/photo/2016/09/01/16/07/cash-1636540_1280.png',
        content: 'Account holder: Chen Family. Balance sufficient for tuition and living costs. Verified by Global Trust Bank.',
      },
    ],
  },
  Career: {
    goal: 'Employment',
    country: 'Singapore',
    docs: [
      {
        name: 'Employment_Letter.pdf',
        img: FALLBACK_IMG,
        content: 'Position: Senior Software Architect at GlobalTech Ltd. Tenure: 2018-2024. HR-verified letter of good standing.',
      },
      {
        name: 'Tax_Document.pdf',
        img: 'https://cdn.pixabay.com/photo/2014/12/21/23/34/check-575778_1280.png',
        content: 'Annual Tax Return 2023. Filed and accepted. Income declared per local jurisdiction. Verified by tax authority.',
      },
    ],
  },
  Taiwan: {
    goal: 'University Study',
    country: 'Germany',
    docs: [
      {
        name: 'NCCU_Transcript.pdf',
        img: FALLBACK_IMG,
        content: 'Student: Chen. GPA: 3.7/4.0. National Chengchi University (NCCU), Department of International Affairs. 128 credits.',
      },
      {
        name: 'Degree_Certificate_NCCU.pdf',
        img: 'https://cdn.pixabay.com/photo/2012/04/18/22/07/certificate-38036_1280.png',
        content: 'Bachelor of Arts in International Affairs. Issued: 2024-06. National Chengchi University.',
      },
      {
        name: 'CTBC_Bank_Statement.pdf',
        img: 'https://cdn.pixabay.com/photo/2016/09/01/16/07/cash-1636540_1280.png',
        content: 'Account holder: Chen. CTBC Bank. Balance: TWD 820,000. Certified for overseas study application.',
      },
    ],
  },
  Korea: {
    goal: 'Talent Pass',
    country: 'Singapore',
    docs: [
      {
        name: 'Kakao_Employment.pdf',
        img: FALLBACK_IMG,
        content: 'Certificate of Employment. Company: Kakao Corp. Position: Senior Software Engineer. Period: 2020-2024.',
      },
      {
        name: 'Tax_Certificate.pdf',
        img: 'https://cdn.pixabay.com/photo/2014/12/21/23/34/check-575778_1280.png',
        content: 'Korean National Tax Service. Income Verification. 2023 Income: KRW 58,000,000. Verified stamp.',
      },
    ],
  },
}

const WORKFLOW = ['收件', '處理', '分析', '報告']

const JURISDICTION_LABELS = {
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

export default function MainPage() {
  const [jurisdiction, setJurisdiction] = useState('USA')
  const [goal, setGoal] = useState('University Study')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [fileLabel, setFileLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(null)
  const [result, setResult] = useState(null)
  const [docId, setDocId] = useState(null)
  const [notice, setNotice] = useState(null)

  const handleFilesChange = (e) => {
    const selected = Array.from(e.target.files)
    setFiles(selected)
    setPreviews(selected.map((file) => ({ name: file.name, img: FALLBACK_IMG })))
    setFileLabel(`${selected.length} 份文件已就緒`)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files)
    setFiles(dropped)
    setPreviews(dropped.map((file) => ({ name: file.name, img: FALLBACK_IMG })))
    setFileLabel(`${dropped.length} 份文件已就緒`)
  }

  const handleDemo = (type) => {
    const scenario = DEMO_DATA[type]
    if (!scenario) return

    setJurisdiction(scenario.country)
    setGoal(scenario.goal)
    setFiles(scenario.docs.map((doc) => new File([doc.content], doc.name, { type: 'text/plain' })))
    setPreviews(scenario.docs)
    setFileLabel(`範例：${scenario.goal} 已載入`)
    setResult(null)
    setDocId(null)
    setNotice(null)
  }

  const handleSubmit = async () => {
    if (!files.length) {
      setNotice({ type: 'warning', text: '請先上傳文件或載入範例情境。' })
      return
    }

    setLoading(true)
    setResult(null)
    setDocId(null)
    setNotice(null)
    setActiveStep('upload')

    const formData = new FormData()
    files.forEach((file) => formData.append('documents', file))
    formData.append('targetCountry', jurisdiction)
    formData.append('goal', goal)

    try {
      const res = await fetch('/api/trust-notary', { method: 'POST', body: formData })

      setActiveStep('process')
      await new Promise((resolve) => setTimeout(resolve, 400))
      setActiveStep('analyze')

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || err.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setActiveStep('report')
      await new Promise((resolve) => setTimeout(resolve, 600))

      setResult(data)
      setDocId(data.analysis?.doc_id ?? null)
    } catch (err) {
      setNotice({ type: 'error', text: '系統錯誤：' + err.message })
      console.error(err)
    } finally {
      setLoading(false)
      setActiveStep(null)
    }
  }

  const previewFilename = previews.map((item) => item.name).join(', ')
  const trustScore = result?.trust_info?.score ?? '--'
  const verdict = result ? result.trust_info?.level ?? '評估完成' : '等待收件'
  const displayGoal = GOAL_LABELS[goal] ?? goal
  const displayJurisdiction = JURISDICTION_LABELS[jurisdiction] ?? jurisdiction

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-[-10%] top-[-10%] h-[45%] w-[45%] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute right-[-10%] top-[20%] h-[30%] w-[30%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[35%] w-[35%] rounded-full bg-emerald-500/8 blur-[120px]" />
      </div>

      <Navbar />

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 px-4 pb-16 pt-6 xl:grid-cols-12 xl:px-8">
        <Sidebar
          jurisdiction={jurisdiction}
          setJurisdiction={setJurisdiction}
          goal={goal}
          setGoal={setGoal}
          fileLabel={fileLabel}
          onFilesChange={handleFilesChange}
          onDrop={handleDrop}
          onSubmit={handleSubmit}
          onDemo={handleDemo}
          loading={loading}
          activeStep={activeStep}
        />

        <section className="space-y-8 xl:col-span-9">
          <div className="glass rounded-[2rem] p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-300/70">
                  Global TrustDrive
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
                  跨境憑證的智能審核中樞
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
                  上傳文件後，系統會依目標法域規則進行驗證，並輸出可共享的決策摘要與證據。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">文件數</p>
                  <p className="mt-2 text-2xl font-black text-white">{files.length}</p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">狀態</p>
                  <p className="mt-2 text-2xl font-black text-cyan-300">
                    {loading ? '運行中' : result ? '就緒' : '待機'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">分數</p>
                  <p className="mt-2 text-2xl font-black text-emerald-300">{trustScore}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/6 bg-white/[0.03] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
                {displayGoal}
              </span>
              <span className="rounded-full border border-white/6 bg-white/[0.03] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
                {displayJurisdiction}
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300">
                {verdict}
              </span>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
                {loading ? '處理中' : result ? '分析完成' : '等待文件'}
              </span>
            </div>

            {notice && (
              <div className={`mt-6 rounded-[1.25rem] border px-4 py-4 text-sm ${
                notice.type === 'error'
                  ? 'border-red-500/20 bg-red-950/40 text-red-300'
                  : 'border-amber-400/20 bg-amber-400/10 text-amber-200'
              }`}>
                {notice.text}
              </div>
            )}
          </div>

          <div className={`grid grid-cols-1 gap-8 transition duration-700 lg:grid-cols-12 ${!result && !loading ? 'opacity-90' : ''}`}>
            <div className="space-y-8 lg:col-span-7">
              <DocumentViewer previews={previews} isScanning={loading} filename={previewFilename} />

              {result?.share_link && (
                <ShareBanner
                  shareLink={result.share_link}
                  vaultShareLink={result.vault_share_link}
                  result={result}
                />
              )}
            </div>

            <AnalysisPanel result={result} />
          </div>

          {result && (
            <section className="glass rounded-[2rem] p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-300">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
                    執行摘要
                  </p>
                  <h3 className="mt-3 text-xl font-black tracking-tight text-white md:text-2xl">
                    {result.analysis?.standard_info?.name ?? '標準審核'} / {result.analysis?.standard_info?.code ?? 'N/A'}
                  </h3>
                  <p className="mt-4 max-w-4xl whitespace-pre-wrap text-sm leading-7 text-slate-300 md:text-base">
                    {result.analysis?.advantage_analysis ?? '分析已完成。'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {docId && <GapAdvisor docId={docId} />}
        </section>
      </main>

      <div className="mx-auto max-w-[1600px] px-4 pb-10 text-[11px] uppercase tracking-[0.24em] text-slate-600 md:px-8 xl:px-8">
        工作流：{WORKFLOW.join(' / ')}
      </div>
    </div>
  )
}
