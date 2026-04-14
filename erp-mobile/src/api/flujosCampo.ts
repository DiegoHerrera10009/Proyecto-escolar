import { apiJson, apiFetch, readApiError } from './client'
import type { EstadoTareaCampo, EtapaTareaCampoDto, TareaCampoResumen } from '../types/campo'

export type SeccionMenu = 'OPERATIVOS' | 'FLOTA'

export async function menuFlujos(seccion: SeccionMenu): Promise<TareaCampoResumen[]> {
  const q = encodeURIComponent(seccion)
  return apiJson<TareaCampoResumen[]>(`/campo/flujos/menu?seccion=${q}`, { method: 'GET' })
}

export async function iniciarFlujoDesdeMenu(plantillaId: number): Promise<TareaCampoResumen> {
  return apiJson<TareaCampoResumen>(`/campo/flujos/plantillas/${plantillaId}/iniciar`, {
    method: 'POST',
  })
}

export type CrearPedidoFlujoPeticion = {
  titulo?: string | null
  descripcion?: string | null
  productos: string[]
}

export type CrearPermisoFlujoPeticion = {
  titulo?: string | null
  tipoPermiso: 'DIAS' | 'HORAS'
  fechaDesde?: string | null
  fechaHasta?: string | null
  horaDesde?: string | null
  horaHasta?: string | null
  fechaPermiso?: string | null
  motivo: string
}

export async function iniciarFlujoPedido(peticion: CrearPedidoFlujoPeticion): Promise<TareaCampoResumen> {
  return apiJson<TareaCampoResumen>('/campo/flujos/pedidos', {
    method: 'POST',
    body: JSON.stringify(peticion),
  })
}

export async function iniciarFlujoPermiso(peticion: CrearPermisoFlujoPeticion): Promise<TareaCampoResumen> {
  return apiJson<TareaCampoResumen>('/campo/flujos/permisos', {
    method: 'POST',
    body: JSON.stringify(peticion),
  })
}

export async function misActividadesActivas(): Promise<TareaCampoResumen[]> {
  return apiJson<TareaCampoResumen[]>('/campo/flujos/mis-actividades/activas', { method: 'GET' })
}

export async function misActividadesSeguimiento(): Promise<TareaCampoResumen[]> {
  return apiJson<TareaCampoResumen[]>('/campo/flujos/mis-actividades/seguimiento', { method: 'GET' })
}

export async function misActividadesHistorial(): Promise<TareaCampoResumen[]> {
  return apiJson<TareaCampoResumen[]>('/campo/flujos/mis-actividades/historial', { method: 'GET' })
}

export async function pasoActivoFlujo(tareaId: number): Promise<EtapaTareaCampoDto | null> {
  const r = await apiFetch(`/campo/flujos/ejecuciones/${tareaId}/paso-activo`, { method: 'GET' })
  if (r.status === 404) return null
  if (!r.ok) {
    throw new Error(await readApiError(r))
  }
  const text = await r.text()
  if (!text || text === 'null') return null
  return JSON.parse(text) as EtapaTareaCampoDto
}

export async function completarPasoFlujo(
  tareaId: number,
  etapaId: number,
  respuestaJson: string,
): Promise<TareaCampoResumen> {
  return apiJson<TareaCampoResumen>(
    `/campo/flujos/ejecuciones/${tareaId}/pasos/${etapaId}/completar`,
    {
      method: 'POST',
      body: JSON.stringify({ respuestaJson }),
    },
  )
}

export async function listarEjecucionesAdmin(estado?: EstadoTareaCampo): Promise<TareaCampoResumen[]> {
  const path =
    estado != null
      ? `/campo/flujos/admin/ejecuciones?estado=${encodeURIComponent(estado)}`
      : '/campo/flujos/admin/ejecuciones'
  return apiJson<TareaCampoResumen[]>(path, { method: 'GET' })
}

export async function cambiarEstadoEjecucionAdmin(
  tareaId: number,
  estadoNuevo: EstadoTareaCampo,
  motivo: string,
): Promise<TareaCampoResumen> {
  const r = await apiFetch(`/campo/flujos/admin/ejecuciones/${tareaId}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ estadoNuevo, motivo }),
  })
  if (!r.ok) {
    throw new Error(await readApiError(r))
  }
  return (await r.json()) as TareaCampoResumen
}
