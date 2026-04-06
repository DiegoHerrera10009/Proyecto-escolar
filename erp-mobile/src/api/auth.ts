import { apiFetch, setAuthToken } from './client'

export type LoginResponse = {
  token: string
  usuarioId: number
  correo: string
  roles: string[]
}

export async function loginRequest(correo: string, clave: string): Promise<LoginResponse> {
  const r = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo: correo.trim(), clave }),
  })

  if (!r.ok) {
    let mensaje = await r.text()
    try {
      const j = JSON.parse(mensaje) as { mensaje?: string; message?: string }
      mensaje = j.mensaje || j.message || mensaje
    } catch {
      // texto plano
    }
    throw new Error(mensaje || `Error ${r.status}`)
  }

  const data = (await r.json()) as LoginResponse
  setAuthToken(data.token)
  return data
}

export function logoutLocal() {
  setAuthToken(null)
}
