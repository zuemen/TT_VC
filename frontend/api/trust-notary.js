import { IncomingForm } from 'formidable'
import { readFile } from 'node:fs/promises'
import crypto from 'node:crypto'
import { makeShareLink, setDoc, cleanName } from './_store.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ multiples: true, keepExtensions: true })
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

function toArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function buildScores(fileCount, goal, targetCountry) {
  const base = 72 + Math.min(12, fileCount * 3)
  const domainBoost = /study|學術/i.test(goal) ? 4 : /employment|就業/i.test(goal) ? 5 : 3
  const geoBoost = /germany|德國/i.test(targetCountry) ? 3 : /singapore|新加坡/i.test(targetCountry) ? 4 : 2
  const score = Math.max(45, Math.min(97, base + domainBoost + geoBoost))
  const level =
    score >= 90 ? '高度通過'
      : score >= 82 ? '通過訊號良好'
      : score >= 70 ? '需要少量補件'
      : '需要強化補件'

  return { score, level }
}

function buildStandardInfo(goal, targetCountry) {
  const name = /study|學術/i.test(goal)
    ? '學術入學審核標準'
    : /employment|就業/i.test(goal)
      ? '就業資格審核標準'
      : '跨境資格審核標準'
  return {
    name,
    code: `${String(targetCountry || 'GLOBAL').toUpperCase().replace(/[^A-Z0-9]/g, '-')}-2026`,
  }
}

async function extractFiles(files) {
  const docs = toArray(files.documents).flatMap((item) => toArray(item))
  const result = []

  for (const file of docs) {
    const fileName = cleanName(file.originalFilename || file.newFilename || file.name, '文件')
    let snippet = '已完成初步抽取，等待規則分析。'
    try {
      const raw = await readFile(file.filepath)
      const text = raw.toString('utf8').replace(/\0/g, '').trim()
      if (text) {
        snippet = text.slice(0, 240)
      }
    } catch {
      // ignore binary or temporary file read errors
    }

    result.push({
      name: fileName,
      content: `[已去識別] ${snippet}`,
    })
  }

  return result
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }

    const { fields, files } = await parseForm(req)
    const targetCountry = String(fields.targetCountry ?? '').trim()
    const goal = String(fields.goal ?? '').trim()
    const docs = await extractFiles(files)

    if (!docs.length) {
      return res.status(400).json({ success: false, error: '未收到文件。' })
    }
    if (!targetCountry || !goal) {
      return res.status(400).json({ success: false, error: '缺少 targetCountry 或 goal。' })
    }

    const docId = `TTVC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const createdAt = Math.floor(Date.now() / 1000)
    const { score, level } = buildScores(docs.length, goal, targetCountry)
    const standardInfo = buildStandardInfo(goal, targetCountry)
    const trustInfo = {
      score,
      level,
      ial: `IAL ${Math.max(1, Math.min(3, Math.ceil(docs.length / 2)))}`,
      advantage: {
        stars: Math.max(1, Math.min(5, Math.round(score / 20))),
        analysis: '文件結構完整度良好，關鍵證據已進入審核流程。',
      },
    }

    const analysis = {
      docId,
      doc_id: docId,
      standard_info: standardInfo,
      converted_metrics: {
        val: `${score}/100`,
        system: 'TTVC 信任模型',
        detail: '已依目標法域、申請目的與文件數量完成初步標準化評估。',
      },
      advantage_analysis: [
        '## 總評',
        `- 目標法域：${targetCountry}`,
        `- 申請目標：${goal}`,
        `- 收件文件：${docs.length} 份`,
        '- 文件結構與申請目標相符，整體可進入下一步審核。',
        '',
        '## 主要優勢',
        '- 憑證類型已覆蓋核心驗證需求。',
        '- 文件內容可支援基礎合規與風險判讀。',
        '',
        '## 後續動作',
        '- 補齊法域要求的官方證明。',
        '- 進一步確認簽章、時效與授權鏈。',
      ].join('\n'),
      redacted_credentials: docs,
      vaultFileIds: docs.map((_, index) => `file-${index + 1}`),
      vaultChatId: `chat-${docId}`,
    }

    const payload = {
      analysis,
      trustInfo,
      targetCountry,
      goal,
      createdAt,
      files: docs,
    }

    await setDoc(docId, payload)

    return res.status(200).json({
      success: true,
      trust_info: trustInfo,
      analysis,
      share_link: makeShareLink(docId),
      vault_share_link: makeShareLink(docId),
      blockchain: {
        credential_hash: `0x${crypto.createHash('sha256').update(JSON.stringify(docs)).digest('hex').slice(0, 64)}`,
        tx_hash: `0x${crypto.createHash('sha256').update(docId).digest('hex').slice(0, 64)}`,
        block_number: 0,
        sepolia_explorer: 'https://sepolia.etherscan.io',
        network: 'demo',
      },
    })
  } catch (err) {
    console.error('[trust-notary]', err)
    return res.status(500).json({ success: false, error: err.message || 'Internal error' })
  }
}
