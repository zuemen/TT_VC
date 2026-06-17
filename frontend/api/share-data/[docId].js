import { getDoc } from '../_store.js'

const DEMO_DOC = {
  analysis: {
    docId: 'VS-GTD-DEMO-TCIW',
    doc_id: 'VS-GTD-DEMO-TCIW',
    standard_info: { name: '學術入學審核標準', code: 'DEMO-2026' },
    converted_metrics: { val: '87/100', system: 'TTVC 信任模型', detail: '示範報告，僅供前端預覽。' },
    advantage_analysis: [
      '## 總評',
      '- 示範文件已完成審核流程。',
      '',
      '## 主要優勢',
      '- 文件完整且格式可讀。',
      '- 適合作為前端共享頁範例。',
    ].join('\n'),
    redacted_credentials: [
      { name: 'NCCU_Transcript.pdf', content: '[已去識別] 示範成績單內容。' },
      { name: 'Degree_Certificate.pdf', content: '[已去識別] 示範學位證明內容。' },
    ],
    vaultFileIds: ['demo-1', 'demo-2'],
    vaultChatId: 'demo-chat-TCIW',
  },
  trust_info: {
    score: 87,
    level: '通過訊號良好',
    ial: 'IAL 2',
    advantage: { stars: 4, analysis: '示範資料足以支撐共享頁展示。' },
  },
  target_country: 'Germany',
  goal: 'University Study',
  created_at: Math.floor(Date.now() / 1000),
}

export default async function handler(req, res) {
  const { docId } = req.query
  const doc = await getDoc(docId)

  if (!doc) {
    if (docId === 'VS-GTD-DEMO-TCIW') {
      return res.status(200).json({ success: true, data: DEMO_DOC })
    }
    return res.status(404).json({ success: false, error: '文件不存在或已過期。' })
  }

  return res.status(200).json({
    success: true,
    data: {
      analysis: doc.analysis,
      trust_info: doc.trustInfo,
      target_country: doc.targetCountry,
      goal: doc.goal,
      created_at: doc.createdAt,
    },
  })
}
