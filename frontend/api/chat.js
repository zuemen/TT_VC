import { getDoc } from './_store.js'

function answer(message, doc) {
  const text = String(message || '').toLowerCase()
  const goal = doc?.goal || '該案件'
  const country = doc?.targetCountry || '目標法域'

  if (text.includes('缺件') || text.includes('missing') || text.includes('gap')) {
    return `就 ${goal} / ${country} 而言，最優先應補齊官方身分證明、財力文件與目標機構要求的補充表單。`
  }

  if (text.includes('分數') || text.includes('score') || text.includes('trust')) {
    return `目前信任分數由文件完整度與目標法域匹配度推估。若要提高分數，請補上可驗證的官方證明與最近一期資料。`
  }

  if (text.includes('下一步') || text.includes('next')) {
    return `建議先確認文件是否已完整收件，再檢查簽章、有效期與授權鏈，最後提交補件清單。`
  }

  return `已收到你的問題。針對 ${goal} / ${country}，目前報告顯示文件已進入標準化審核流程；若需要，我可以進一步整理缺件與補件順序。`
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const docId = body.docId || body.doc_id
    const message = body.message
    if (!message) {
      return res.status(400).json({ success: false, error: '缺少 message。' })
    }

    const doc = docId ? await getDoc(docId) : null
    return res.status(200).json({
      success: true,
      response: answer(message, doc),
    })
  } catch (err) {
    console.error('[chat]', err)
    return res.status(500).json({ success: false, error: err.message || 'Internal error' })
  }
}
