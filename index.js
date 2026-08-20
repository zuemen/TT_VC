const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const multer     = require('multer');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const vaultService  = require('./services/vaultsage');
const trustEngine   = require('./services/trustEngine');
const ssiService    = require('./services/ssi');
const store         = require('./services/db');

dotenv.config();

const app  = express();
const port = process.env.PORT || 4000;
const VAULT_KEY = process.env.VAULTSAGE_API_KEY;

app.set('trust proxy', 1);

if (!VAULT_KEY) {
  console.warn('[WARN] VAULTSAGE_API_KEY is not set. VaultSage API routes may fail.');
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

app.get('/favicon.ico', (req, res) => res.status(204).end());

const FRONTEND_DIST = path.join(__dirname, 'frontend', 'dist');
const PUBLIC_DIR = path.join(__dirname, 'public');
const STATIC_ROOT = require('fs').existsSync(FRONTEND_DIST) ? FRONTEND_DIST : PUBLIC_DIR;

app.use(express.static(STATIC_ROOT));

// Explicitly serve index.html for the root route to prevent 404s
app.get('/', (req, res) => {
  res.sendFile(path.join(STATIC_ROOT, 'index.html'));
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please wait.' },
});
app.use('/api/', limiter);

// /api/chat 與 /api/gap-advisor 每次呼叫都會消耗伺服器端的 VaultSage 額度，
// 只靠整體 60 次/15 分鐘不夠，另外加一層更嚴格的限制避免額度被刷爆。
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'AI 查詢過於頻繁，請稍候再試。' },
});

// docId 是取用整份文件分析的唯一憑證，先做格式檢查再進 KV，
// 避免以任意字串探測儲存層。
const DOC_ID_RE = /^[A-Za-z0-9-]{6,64}$/;
const isValidDocId = (id) => typeof id === 'string' && DOC_ID_RE.test(id);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
});

// ── Routes ───────────────────────────────────────────────────────────────────

// Main notary endpoint — accepts multipart/form-data
app.post('/api/trust-notary', upload.array('documents', 10), async (req, res) => {
  try {
    const files = req.files;
    const { targetCountry, goal } = req.body;

    if (!VAULT_KEY) {
      return res.status(500).json({ success: false, error: 'Missing VAULTSAGE_API_KEY on server.' });
    }
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No documents uploaded.' });
    }
    if (!targetCountry || !goal) {
      return res.status(400).json({ success: false, error: 'Missing targetCountry or goal.' });
    }

    console.log(`\n[NOTARY] ${goal} / ${targetCountry} — ${files.length} file(s): ${files.map(f => f.originalname).join(', ')}`);

    // 1. VaultSage: upload → process → AI analyse → share
    const analysis = await vaultService.process(VAULT_KEY, files, { targetCountry, goal });

    // 2. SSI: SHA-256 hash + Sepolia anchoring
    const ssiResult = await ssiService.verify({
      filenames:    files.map(f => f.originalname),
      fileContents: files.map(f => f.buffer),
      docId:        analysis.docId,
    });

    // 3. Trust score — calibrated with real VaultSage AI verdict
    const trustInfo = trustEngine.calculateCredibility(ssiResult, analysis.advantage_analysis);
    const advantage = trustEngine.evaluateAdvantage(goal, trustInfo.score);

    // 4. Build share URLs
    const host = req.headers.host || `localhost:${port}`;
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const localShareLink = `${proto}://${host}/share/${analysis.docId}`;

    // 5. Persist for SmartDrop (survives restarts via db.js)
    await store.set(analysis.docId, {
      analysis,
      trustInfo,
      targetCountry,
      goal,
      vaultChatId: analysis.vaultChatId,
      createdAt: Date.now(),
    });

    // 5. Build response with snake_case for frontend
    const responseAnalysis = {
      ...analysis,
      doc_id: analysis.docId,
    };

    res.json({
      success: true,
      trust_info: { ...trustInfo, advantage },
      analysis: responseAnalysis,
      share_link: localShareLink,
      vault_share_link: analysis.vaultShareUrl,
      blockchain: {
        credential_hash:  ssiResult.credential_hash,
        tx_hash:          ssiResult.tx_hash,
        block_number:     ssiResult.block_number,
        sepolia_explorer: ssiResult.sepolia_explorer,
        network:          ssiResult.network,
      },
    });

  } catch (err) {
    console.error('[NOTARY ERROR]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// SmartDrop viewer — serve React SPA (handles /share/:docId via client-side router)
app.get('/share/:docId', (req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.sendFile(path.join(STATIC_ROOT, 'index.html'));
});

const DEMO_DOC = {
  analysis: {
    docId: 'VS-GTD-DEMO-TCIW', doc_id: 'VS-GTD-DEMO-TCIW',
    standard_info:      { name: 'UNESCO WRL / ECTS', code: 'EDU-WRL-2026' },
    converted_metrics:  { val: '3.92 / 4.0', system: 'WES Equivalent', detail: 'Percentile: Top 5%' },
    advantage_analysis: '[AI CERTIFIED VERDICT: APPROVED]\n\n1. DOCUMENT SUMMARY: Academic transcript and degree certificate from National Chengchi University (NCCU).\n2. COMPLIANCE CHECK: Fully compliant with German university admission requirements.\n3. STRENGTHS: Verified GPA 3.8/4.0, 128 ECTS-equivalent credits, recognized institution.\n4. GAPS: None identified.\n5. VERDICT: APPROVED — All requirements satisfied.',
    redacted_credentials: [
      { name: '成績單_NCCU_Transcript.pdf', content: '[VaultSage AI Secured]\nStatus: Authenticated | IAL Level: 3' },
      { name: 'Degree_Certificate_NCCU.pdf', content: '[VaultSage AI Secured]\nStatus: Authenticated | IAL Level: 3' },
    ],
    vaultFileIds: ['demo-1', 'demo-2'], vaultChatId: 'demo-chat-TCIW',
  },
  trust_info:     { score: 87, ial: 'EDU_VERIFIED', ialTier: 2, issuer: 'Global Trust Registry', signatureValid: true },
  target_country: 'Germany',
  goal:           'University Study',
  created_at:     Math.floor(Date.now() / 1000) + 86400 * 365,
};

app.get('/api/share-data/:docId', async (req, res) => {
  const { docId } = req.params;
  if (!isValidDocId(docId)) {
    return res.status(400).json({ success: false, error: 'Invalid document id.' });
  }
  // 分享內容含使用者上傳文件的分析結果：不得被快取或被搜尋引擎收錄
  res.set('Cache-Control', 'no-store, private');
  res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  const doc = await store.get(docId);

  if (!doc) {
    if (docId === 'VS-GTD-DEMO-TCIW') return res.json({ success: true, data: DEMO_DOC });
    return res.status(404).json({ success: false, error: 'Document not found or expired.' });
  }

  // Return with snake_case for frontend compatibility
  res.json({
    success: true,
    data: {
      analysis: doc.analysis,
      trust_info: doc.trustInfo,
      target_country: doc.targetCountry,
      goal: doc.goal,
      created_at: Math.floor(doc.createdAt / 1000),
    }
  });
});

// Gap Advisor — AI-powered missing document analysis
app.post('/api/gap-advisor', aiLimiter, async (req, res) => {
  try {
    if (!VAULT_KEY) {
      return res.status(500).json({ success: false, error: 'Missing VAULTSAGE_API_KEY on server.' });
    }

    const { docId, doc_id } = req.body;
    const targetId = docId || doc_id;
    if (!targetId) return res.status(400).json({ success: false, error: 'Missing docId.' });
    if (!isValidDocId(targetId)) {
      return res.status(400).json({ success: false, error: 'Invalid document id.' });
    }

    const doc = await store.get(targetId);
    if (!doc) return res.status(404).json({ success: false, error: 'Session not found or expired.' });

    const fileIds = doc.analysis?.vaultFileIds;
    if (!fileIds || fileIds.length === 0)
      return res.status(400).json({ success: false, error: 'No VaultSage file IDs in session.' });

    console.log(`[GAP ADVISOR] ${doc.goal} / ${doc.targetCountry}`);
    const { content } = await vaultService.analyzeGaps(VAULT_KEY, fileIds, doc.goal, doc.targetCountry);
    res.json({ success: true, gaps: content });
  } catch (err) {
    console.error('[GAP ADVISOR ERROR]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Real AI chat via VaultSage
app.post('/api/chat', aiLimiter, async (req, res) => {
  try {
    if (!VAULT_KEY) {
      return res.status(500).json({ success: false, error: 'Missing VAULTSAGE_API_KEY on server.' });
    }

    const { docId, doc_id, message } = req.body;
    const targetId = docId || doc_id;
    if (!message) return res.status(400).json({ success: false, error: 'Missing message.' });
    if (typeof message !== 'string' || message.length > 2000) {
      return res.status(400).json({ success: false, error: 'message 需為 2000 字以內的字串。' });
    }
    if (!isValidDocId(targetId)) {
      return res.status(400).json({ success: false, error: 'Invalid document id.' });
    }

    let doc = await store.get(targetId);
    if (!doc && targetId === 'VS-GTD-DEMO-TCIW') {
      doc = { vaultChatId: 'demo-chat-TCIW', goal: 'University Study', targetCountry: 'Germany' };
    }
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found or expired.' });
    if (!doc.vaultChatId) return res.status(400).json({ success: false, error: 'No active VaultSage chat session.' });

    const response = await vaultService.chatFollowUp(VAULT_KEY, doc.vaultChatId, message);
    res.json({ success: true, response });

  } catch (err) {
    console.error('[CHAT ERROR]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Start / Export ───────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log('\n====================================================');
    console.log('  Global TrustDrive 7.0 + VaultSage AI — LIVE');
    console.log(`  Local:   http://localhost:${port}`);
    console.log(`  Network: http://0.0.0.0:${port}`);
    console.log('====================================================\n');
  });
}

module.exports = app;

