import { getDoc } from './_store.js'

function buildGapReport(goal, targetCountry, files = []) {
  const fileCount = files.length
  const fileNames = files.map((file) => `- ${file.name}`).join('\n')

  return [
    '## 缺件結論',
    `- 目標法域：${targetCountry}`,
    `- 申請目標：${goal}`,
    `- 已收件文件：${fileCount} 份`,
    '',
    '## 優先補件',
    '- 官方身分或資格證明',
    '- 最近一期財力或稅務資料',
    '- 目標機構要求的補充表單',
    '',
    '## 目前文件清單',
    fileNames || '- 無',
    '',
    '## 後續建議',
    '- 先補官方證明，再補說明文件。',
    '- 若要加速審核，請優先補足與法域直接相關的文件。',
  ].join('\n')
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const docId = body.docId || body.doc_id
    if (!docId) {
      return res.status(400).json({ success: false, error: '缺少 docId。' })
    }

    const doc = await getDoc(docId)
    if (!doc) {
      return res.status(404).json({ success: false, error: '文件不存在或已過期。' })
    }

    const gaps = buildGapReport(doc.goal, doc.targetCountry, doc.files || doc.analysis?.redacted_credentials || [])
    return res.status(200).json({ success: true, gaps })
  } catch (err) {
    console.error('[gap-advisor]', err)
    return res.status(500).json({ success: false, error: err.message || 'Internal error' })
  }
}
