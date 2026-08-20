import asyncio
import re
import secrets
import string
import time
from typing import List, Optional, Tuple

import httpx

API_BASE = "https://api.vaultsage.ai/api/v1"

GOAL_STANDARDS = {
    "University Study":       {"name": "UNESCO WRL / ECTS",            "code": "EDU-WRL-2026"},
    "Employment":             {"name": "OPEN BADGES 3.0 / IEEE 1484",  "code": "JOB-OB-3.0"},
    "Healthcare License":     {"name": "HL7 FHIR R4 / PRACTITIONER",  "code": "MED-FHIR-R4"},
    "Digital Nomad Visa":     {"name": "FATF AML / ISO 20022",         "code": "FIN-FATF-R16"},
    "Banking Setup":          {"name": "WOLFSBERG KYC / ISO 20022",    "code": "FIN-KYC-WOLF"},
    "Talent Pass":            {"name": "ILO ISCO-08 / UNESCO ISCED",   "code": "TLT-ISCO-08"},
    "Skilled Migration Visa": {"name": "ILO ISCO-08 / ANZSCO",         "code": "MIG-ISCO-ANZ"},
    "Exchange Program":       {"name": "UNESCO / ERASMUS+ ECTS",        "code": "EDU-EX-2026"},
}

GOAL_METRICS = {
    "University Study":       {"val": "3.92 / 4.0",      "system": "WES Equivalent",    "detail": "Percentile: Top 5%"},
    "Employment":             {"val": "L7 Architect",     "system": "IEEE 1484.20.1",    "detail": "Skill Match: 94%"},
    "Healthcare License":     {"val": "Practitioner R1",  "system": "HL7 FHIR R4",       "detail": "EU Reciprocity: Full"},
    "Digital Nomad Visa":     {"val": "$65,000 USD",      "system": "ISO 20022 / AML",   "detail": "KYC Status: Verified"},
    "Banking Setup":          {"val": "Tier 1 Private",   "system": "Wolfsberg KYC",     "detail": "Risk Level: Low"},
    "Talent Pass":            {"val": "O-1A Aligned",     "system": "ILO ISCO-08",       "detail": "Expertise: Verified"},
    "Skilled Migration Visa": {"val": "Points: 95/100",   "system": "ANZSCO / NZQF",     "detail": "Priority Processing"},
    "Exchange Program":       {"val": "Credits: 60 ECTS", "system": "ERASMUS+ Standard", "detail": "Mobility Ready"},
}

PII_PATTERNS = [
    (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),                                          "***-**-****"),
    (re.compile(r"\b[\w.-]+@[\w.-]+\.\w{2,4}\b"),                                   "[EMAIL REDACTED]"),
    (re.compile(r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b"),                       "****-****-****-****"),
    (re.compile(r"\b(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b"),   "[PHONE REDACTED]"),
    (re.compile(r"\$[\d,]+(?:\.\d{2})?"),                                            "[AMOUNT REDACTED]"),
]


def _headers(api_key: str) -> dict:
    return {"x-api-key": api_key}


def redact_pii(text: str) -> str:
    if not text:
        return text
    for pattern, replacement in PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def _rand_doc_id() -> str:
    """分享用文件識別碼。

    docId 就是分享連結的唯一憑證，必須不可預測。舊版用 random.choices
    （Mersenne Twister，非密碼學安全）且只有 6 碼，可被列舉或預測，
    等同任何人都能撈到他人上傳文件的分析結果。改用 secrets（96 bits）。
    """
    return "VS-GTD-" + secrets.token_hex(12).upper()


async def _upload_file(api_key: str, content: bytes, filename: str, mime_type: str) -> str:
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(
            f"{API_BASE}/files/",
            headers=_headers(api_key),
            files={"files": (filename, content, mime_type or "application/octet-stream")},
            params={"conflict_resolution": "keep"},
        )
        r.raise_for_status()
        return str(r.json()["file_id"])


async def _poll_status(api_key: str, file_id: str, max_wait: float = 180.0) -> dict:
    terminal = {"completed", "failed", "skipped"}
    deadline = time.time() + max_wait
    async with httpx.AsyncClient(timeout=30) as client:
        while time.time() < deadline:
            r = await client.post(
                f"{API_BASE}/files/processing-status",
                headers={**_headers(api_key), "Content-Type": "application/json"},
                json={"file_ids": [file_id]},
            )
            r.raise_for_status()
            rows = r.json().get("results") or r.json().get("result") or []
            if rows:
                row = rows[0]
                if (row.get("task_summary_status") in terminal and
                        row.get("task_snapshot_status") in terminal):
                    return row
            await asyncio.sleep(2.5)
    raise TimeoutError("VaultSage file processing timeout")


async def _chat_first_turn(api_key: str, file_ids: List[str], question: str) -> Tuple[str, str]:
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(
            f"{API_BASE}/chat/message/v2",
            headers={**_headers(api_key), "Content-Type": "application/json"},
            json={
                "messages": [{"actor": "user", "content": question, "file_ids": file_ids}],
                "persist": True,
            },
        )
        r.raise_for_status()
        data = r.json()
        msgs = data.get("messages") or []
        ai_msg = next((m for m in reversed(msgs) if m.get("actor") != "user"), None)
        content = (ai_msg.get("content") if ai_msg else None) or data.get("response", "Analysis complete.")
        return data.get("new_chat_id", ""), content


async def chat_follow_up(api_key: str, chat_id: str, message: str) -> str:
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(
            f"{API_BASE}/chat/message/v2",
            headers={**_headers(api_key), "Content-Type": "application/json"},
            json={
                "messages": [{"actor": "user", "content": message}],
                "chat_id": chat_id,
                "persist": True,
            },
        )
        r.raise_for_status()
        data = r.json()
        msgs = data.get("messages") or []
        ai_msg = next((m for m in reversed(msgs) if m.get("actor") != "user"), None)
        return (ai_msg.get("content") if ai_msg else None) or data.get("response", "No response.")


async def _create_share(api_key: str, file_ids: List[str]) -> Optional[str]:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            f"{API_BASE}/share/",
            headers={**_headers(api_key), "Content-Type": "application/json"},
            json={"file_ids": file_ids, "directory_ids": None, "emails": None,
                  "message": None, "password": None, "expire_at": None},
        )
        r.raise_for_status()
        d = r.json()
        return d.get("share_url") or d.get("url") or (
            f"https://vaultsage.ai/share/{d['token']}" if d.get("token") else None
        )


async def process_documents(
    api_key: str,
    files: List[dict],
    target_country: str,
    goal: str,
) -> dict:
    standard = GOAL_STANDARDS.get(goal, {"name": "ISO 27001", "code": "ISO-STD"})
    metrics   = GOAL_METRICS.get(goal,   {"val": "Verified",   "system": "Standard", "detail": "Compliance OK"})

    print(f"[VaultSage] Uploading {len(files)} file(s)…")
    file_ids = []
    for f in files:
        fid = await _upload_file(api_key, f["content"], f["filename"], f["mime_type"])
        file_ids.append(fid)
        print(f"[VaultSage] Uploaded {f['filename']} → {fid}")

    print("[VaultSage] Polling for processing…")
    await asyncio.gather(*[_poll_status(api_key, fid) for fid in file_ids])
    print("[VaultSage] Processing complete.")

    n = len(files)
    prompt = (
        f"You are a certified international credential authentication system.\n"
        f"Analyze {'the ' + str(n) + ' uploaded credential documents' if n > 1 else 'the uploaded credential document'} "
        f"for the purpose of \"{goal}\" in \"{target_country}\".\n"
        f"Applicable standard: {standard['name']} ({standard['code']}).\n\n"
        f"Provide a structured analysis:\n"
        f"1. DOCUMENT SUMMARY: What credentials/documents are present and their key details\n"
        f"2. COMPLIANCE CHECK: Whether they fully meet {target_country}'s requirements for {goal}\n"
        f"3. STRENGTHS: Top 3 positive indicators found in the documents\n"
        f"4. GAPS: Missing elements or concerns (if any)\n"
        f"5. VERDICT: APPROVED / CONDITIONAL / INSUFFICIENT — with a one-sentence justification\n\n"
        f"Be concise, professional, and jurisdiction-specific to {target_country}."
    )

    print("[VaultSage] Running AI analysis…")
    chat_id, analysis_text = await _chat_first_turn(api_key, file_ids, prompt)
    print(f"[VaultSage] Done. chat_id={chat_id}")

    vault_share_url = None
    try:
        vault_share_url = await _create_share(api_key, file_ids)
    except Exception as e:
        print(f"[VaultSage] Share creation failed (non-critical): {e}")

    doc_id = _rand_doc_id()
    redacted_credentials = [
        {"name": f["filename"],
         "content": f"[VaultSage AI Report — {f['filename']}]\n\n{redact_pii(analysis_text)}"}
        for f in files
    ]

    return {
        "doc_id":               doc_id,
        "standard_info":        standard,
        "converted_metrics":    metrics,
        "advantage_analysis":   analysis_text,
        "redacted_credentials": redacted_credentials,
        "vault_file_ids":       file_ids,
        "vault_chat_id":        chat_id,
        "vault_share_url":      vault_share_url,
    }


async def analyze_gaps(api_key: str, file_ids: List[str], goal: str, target_country: str) -> str:
    prompt = (
        f"You are an expert international credential advisor for {target_country} requirements.\n\n"
        f"TASK: Perform a complete DOCUMENT GAP ANALYSIS for a person applying for \"{goal}\" in \"{target_country}\".\n\n"
        f"## DOCUMENTS DETECTED\n"
        f"List each uploaded document, its type, and whether it appears valid/expired/incomplete.\n\n"
        f"## REQUIRED DOCUMENTS ({target_country} Official Requirements)\n"
        f"List ALL documents officially required for {goal} in {target_country} with their exact official names.\n\n"
        f"## GAPS FOUND\n"
        f"For each missing or incomplete document:\n"
        f"- Document Name\n"
        f"- Why It Is Required\n"
        f"- Where to Obtain It (official authority / website)\n"
        f"- Estimated Processing Time\n\n"
        f"## TOP 3 PRIORITY ACTIONS\n"
        f"Ordered by urgency. Be specific and actionable.\n\n"
        f"## ESTIMATED TOTAL TIMELINE\n"
        f"Realistic completion timeline if starting today.\n\n"
        f"Use official document names specific to {target_country}. Be concise and practical."
    )
    _, content = await _chat_first_turn(api_key, file_ids, prompt)
    return content
