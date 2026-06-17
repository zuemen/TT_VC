import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../hooks/useI18n'

const FALLBACK_IMG = 'https://cdn.pixabay.com/photo/2013/07/12/15/20/document-149692_1280.png'

function truncateText(text) {
  const value = String(text ?? '')
  if (!value) return '目前沒有可預覽的內容。'
  if (value.length <= 180) return value
  return `${value.slice(0, 180).trim()}...`
}

export default function DocumentViewer({ previews = [], isScanning = false, filename = '' }) {
  const { t } = useI18n()
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(0)
  }, [previews])

  const activeDoc = useMemo(() => previews[activeIndex] ?? previews[0] ?? null, [previews, activeIndex])

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/6 bg-slate-900/70 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/6 bg-slate-950/70 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-red-400/80 shadow-[0_0_10px_rgba(248,113,113,0.35)]" />
          <span className="h-3.5 w-3.5 rounded-full bg-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.35)]" />
          <span className="h-3.5 w-3.5 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.35)]" />
        </div>
        <div className="min-w-0 max-w-[60%] truncate text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
          {filename || t('noAssets')}
        </div>
      </div>

      <div className="relative">
        {isScanning && (
          <div className="absolute inset-0 z-20 overflow-hidden rounded-[1.75rem] pointer-events-none">
            <div className="scanning-line absolute h-1 w-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
            <div className="absolute inset-0 bg-cyan-400/6 backdrop-blur-[1px]" />
          </div>
        )}

        {!previews.length ? (
          <div className="grid min-h-[560px] place-items-center px-6 py-16">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/6 bg-white/[0.03]">
                <svg className="h-9 w-9 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-black text-white">
                等待文件收件
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                上傳文件組合或載入範例情境，即可進入驗證工作區。
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-0 xl:grid-cols-[280px_minmax(0,1fr)]">
            <div className="border-b border-white/6 bg-slate-950/50 p-5 xl:border-b-0 xl:border-r">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                    文件組
                  </p>
                  <h3 className="mt-2 text-lg font-black text-white">
                    {previews.length} 份文件
                  </h3>
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                  就緒
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {previews.map((item, index) => {
                  const selected = index === activeIndex
                  return (
                    <button
                      key={`${item.name}-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`flex w-full items-start gap-3 rounded-[1.25rem] border px-3 py-3 text-left transition ${
                        selected
                          ? 'border-cyan-400/30 bg-cyan-400/10'
                          : 'border-white/8 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.05]'
                      }`}
                    >
                      <img
                        src={item.img || FALLBACK_IMG}
                        alt={item.name}
                        className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/8"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMG
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-bold ${selected ? 'text-white' : 'text-slate-200'}`}>
                          {item.name}
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          {truncateText(item.content)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                    目前文件
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
                    {activeDoc?.name ?? '文件預覽'}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                    {truncateText(activeDoc?.content)}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-white/6 bg-white/[0.03] px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">文件數</p>
                    <p className="mt-2 text-lg font-black text-white">{previews.length}</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-white/6 bg-white/[0.03] px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">模式</p>
                    <p className="mt-2 text-lg font-black text-cyan-300">
                      {isScanning ? '掃描中' : '就緒'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                <div className="overflow-hidden rounded-[1.75rem] border border-white/6 bg-slate-950/60">
                  <div className="border-b border-white/6 px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                      預覽畫布
                    </p>
                  </div>
                  <div className="grid min-h-[360px] place-items-center p-6">
                    <div className="w-full max-w-[360px] rounded-[1.5rem] border border-white/8 bg-white p-4 shadow-2xl shadow-black/30">
                      <img
                        src={activeDoc?.img || FALLBACK_IMG}
                        alt={activeDoc?.name ?? 'preview'}
                        className="aspect-[4/5] w-full rounded-[1rem] object-cover"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMG
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.5rem] border border-white/6 bg-white/[0.03] p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">檢視備註</p>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                      <p>{activeDoc ? '文件已進入驗證流程，並送入分析管線。' : '尚未選取任何文件。'}</p>
                      <p className="text-slate-500">
                        你可以使用左側清單在不同文件之間切換比對。
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/6 bg-white/[0.03] p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">文件細節</p>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">已選文件</span>
                        <span className="truncate text-sm font-bold text-white">{activeDoc?.name ?? '--'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-500">預覽來源</span>
                        <span className="truncate text-sm font-bold text-cyan-300">{activeDoc?.img ? '圖片預覽' : '備援預覽'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
