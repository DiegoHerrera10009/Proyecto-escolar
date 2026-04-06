import { API_BASE_URL } from '../config/api'

let authToken: string | null = null

export async function readApiError(r: Response): Promise<string> {
  const t = await r.text()
  try {
    const j = JSON.parse(t) as { mensaje?: string; message?: string; error?: string }
    return j.mensaje || j.message || j.error || t || `Error ${r.status}`
  } catch {
    return t.trim() || `Error ${r.status}`
  }
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await apiFetch(path, init)
  if (!r.ok) {
    throw new Error(await readApiError(r))
  }
  return (await r.json()) as T
}

export function setAuthToken(token: string | null) {
  authToken = token
}

export function getAuthToken(): string | null {
  return authToken
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const base = API_BASE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  const url = `${base}${p}`

  const headers = new Headers(options.headers)
  if (options.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`)
  }

  return fetch(url, { ...options, headers })
}
