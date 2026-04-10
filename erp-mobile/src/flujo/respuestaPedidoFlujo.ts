import {
  ETAPA_BODEGA_DESPACHO,
  ETAPA_BODEGA_RECEPCION,
  ETAPA_BODEGA_REVISION,
  ETAPA_COMPRAS,
  esEtapaFormularioPedido,
} from './etapasPedido'

export type FormPedidoState = {
  bodegaInv: 'SI' | 'NO' | null
  productosFaltantes: string
  cotizacionesSolicitadas: boolean
  ordenCompraGenerada: boolean
  compraRealizada: boolean
  productosRecibidos: boolean
  despachoRealizado: boolean
  observacionDespacho: string
}

export function estadoFormPedidoInicial(): FormPedidoState {
  return {
    bodegaInv: null,
    productosFaltantes: '',
    cotizacionesSolicitadas: false,
    ordenCompraGenerada: false,
    compraRealizada: false,
    productosRecibidos: false,
    despachoRealizado: false,
    observacionDespacho: '',
  }
}

/** null = ok; string = mensaje para el usuario */
export function validarCamposPedido(nombrePaso: string | null | undefined, s: FormPedidoState): string | null {
  if (!nombrePaso || !esEtapaFormularioPedido(nombrePaso)) return null

  if (nombrePaso === ETAPA_BODEGA_REVISION) {
    if (s.bodegaInv === null) {
      return 'Indica si el inventario cubre todo el pedido (Sí o No).'
    }
    if (s.bodegaInv === 'NO' && !s.productosFaltantes.trim()) {
      return 'Si falta stock, describe qué productos faltan.'
    }
    return null
  }

  if (nombrePaso === ETAPA_COMPRAS) {
    if (!s.cotizacionesSolicitadas || !s.ordenCompraGenerada || !s.compraRealizada) {
      return 'Marca las tres confirmaciones de Compras (cotizaciones, orden de compra y compra realizada).'
    }
    return null
  }

  if (nombrePaso === ETAPA_BODEGA_RECEPCION) {
    if (!s.productosRecibidos) {
      return 'Confirma si los productos ya se recibieron en bodega.'
    }
    return null
  }

  if (nombrePaso === ETAPA_BODEGA_DESPACHO) {
    if (!s.despachoRealizado) {
      return 'Confirma si el despacho está realizado para cerrar el flujo.'
    }
    return null
  }

  return null
}

export function construirRespuestaJsonConFirma(
  nombrePaso: string | null | undefined,
  firmaDataUrl: string,
  s: FormPedidoState,
): string {
  const firma = firmaDataUrl.startsWith('data:image/') ? firmaDataUrl : `data:image/png;base64,${firmaDataUrl}`
  const o: Record<string, unknown> = { firmaSistema: firma }

  if (!nombrePaso || !esEtapaFormularioPedido(nombrePaso)) {
    return JSON.stringify(o)
  }

  if (nombrePaso === ETAPA_BODEGA_REVISION) {
    o.inventarioCompleto = s.bodegaInv === 'SI'
    if (s.bodegaInv === 'NO') {
      o.productosFaltantes = s.productosFaltantes.trim()
    }
    return JSON.stringify(o)
  }

  if (nombrePaso === ETAPA_COMPRAS) {
    o.cotizacionesSolicitadas = s.cotizacionesSolicitadas
    o.ordenCompraGenerada = s.ordenCompraGenerada
    o.compraRealizada = s.compraRealizada
    return JSON.stringify(o)
  }

  if (nombrePaso === ETAPA_BODEGA_RECEPCION) {
    o.productosRecibidos = s.productosRecibidos
    return JSON.stringify(o)
  }

  if (nombrePaso === ETAPA_BODEGA_DESPACHO) {
    o.despachoRealizado = s.despachoRealizado
    if (s.observacionDespacho.trim()) {
      o.observacionDespacho = s.observacionDespacho.trim()
    }
    return JSON.stringify(o)
  }

  return JSON.stringify(o)
}
