import { ETAPA_COMERCIAL } from './etapasPedido'

/**
 * Igual que `extraerProductosPedido` en App.jsx: la descripción de la ejecución incluye
 * `Productos: ...` al crear el pedido desde Comercial (ServicioFlujoCampo.iniciarFlujoPedido).
 */
export function extraerProductosDesdeDescripcionTarea(descripcion: string | null | undefined): string {
  const desc = String(descripcion ?? '')
  const marcador = 'Productos:'
  const idx = desc.indexOf(marcador)
  if (idx < 0) return ''
  return desc.slice(idx + marcador.length).trim()
}

/** Respuesta guardada al crear el pedido: `{ pedidoCreado, productos: string[] }`. */
export function extraerProductosDesdeEtapaComercial(respuestaJson: string | null | undefined): string {
  if (!respuestaJson?.trim()) return ''
  try {
    const raw = JSON.parse(respuestaJson) as { productos?: unknown }
    if (!Array.isArray(raw.productos)) return ''
    return raw.productos.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).join(', ')
  } catch {
    return ''
  }
}

/** Texto para mostrar en UI: descripción de tarea y, si hace falta, etapa Comercial completada. */
export async function resolverTextoProductosPedido(
  descripcion: string | null | undefined,
  listarEtapas: () => Promise<{ nombre?: string | null; respuestaJson?: string | null }[]>,
): Promise<string> {
  const desdeDesc = extraerProductosDesdeDescripcionTarea(descripcion)
  if (desdeDesc) return desdeDesc
  try {
    const etapas = await listarEtapas()
    const com = etapas.find((e) => e.nombre === ETAPA_COMERCIAL)
    return extraerProductosDesdeEtapaComercial(com?.respuestaJson ?? undefined)
  } catch {
    return ''
  }
}
