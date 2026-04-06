import { apiJson } from './client'
import type { EstadoTareaCampo, HistorialTareaCampoDto, TareaCampoResumen } from '../types/campo'

export async function listarTareasCampo(): Promise<TareaCampoResumen[]> {
  return apiJson<TareaCampoResumen[]>('/campo/tareas', { method: 'GET' })
}

export async function obtenerTareaCampo(id: number): Promise<TareaCampoResumen> {
  return apiJson<TareaCampoResumen>(`/campo/tareas/${id}`, { method: 'GET' })
}

export type CambioEstadoBody = {
  estadoNuevo: EstadoTareaCampo
  comentario?: string | null
  latitud?: number | null
  longitud?: number | null
}

export async function cambiarEstadoTareaCampo(id: number, body: CambioEstadoBody): Promise<TareaCampoResumen> {
  return apiJson<TareaCampoResumen>(`/campo/tareas/${id}/estado`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function historialTareaCampo(id: number): Promise<HistorialTareaCampoDto[]> {
  return apiJson<HistorialTareaCampoDto[]>(`/campo/tareas/${id}/historial`, { method: 'GET' })
}
