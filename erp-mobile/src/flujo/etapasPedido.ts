/** Nombres exactos de etapas en ServicioFlujoCampo (flujo pedido comercial). */
export const ETAPA_COMERCIAL = 'Comercial - Crear pedido'
export const ETAPA_BODEGA_REVISION = 'Bodega - Revisar inventario'
export const ETAPA_COMPRAS = 'Compras - Gestionar compra'
export const ETAPA_BODEGA_RECEPCION = 'Bodega - Registrar recepcion'
export const ETAPA_BODEGA_DESPACHO = 'Bodega - Despachar pedido'

const ETAPAS_CON_FORMULARIO_PEDIDO = new Set([
  ETAPA_BODEGA_REVISION,
  ETAPA_COMPRAS,
  ETAPA_BODEGA_RECEPCION,
  ETAPA_BODEGA_DESPACHO,
])

export function esEtapaFormularioPedido(nombrePaso: string | null | undefined): boolean {
  if (!nombrePaso) return false
  return ETAPAS_CON_FORMULARIO_PEDIDO.has(nombrePaso)
}
