import { kv } from '@vercel/kv'

const MEMORY_KEY = '__TTVC_STORE__'
const PREFIX = 'ttvc:doc:'

function hasKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

function memoryStore() {
  if (!globalThis[MEMORY_KEY]) {
    globalThis[MEMORY_KEY] = new Map()
  }
  return globalThis[MEMORY_KEY]
}

export async function setDoc(docId, payload) {
  if (hasKv()) {
    await kv.set(`${PREFIX}${docId}`, payload, { ex: 60 * 60 * 24 * 7 })
    return
  }
  memoryStore().set(docId, payload)
}

export async function getDoc(docId) {
  if (hasKv()) {
    const value = await kv.get(`${PREFIX}${docId}`)
    if (value) return value
  }
  return memoryStore().get(docId) ?? null
}

export function makeShareLink(docId) {
  const host = process.env.VERCEL_URL
  if (host) return `https://${host}/share/${docId}`
  return `http://localhost:4173/share/${docId}`
}

export function cleanName(fileName, fallback = '文件') {
  const value = String(fileName ?? '').trim()
  return value || fallback
}
