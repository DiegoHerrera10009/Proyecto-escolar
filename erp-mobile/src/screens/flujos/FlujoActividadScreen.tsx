import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native'
import { useFocusEffect, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import SignatureCanvas from 'react-native-signature-canvas'
import type { SignatureViewRef } from 'react-native-signature-canvas'

import { completarPasoFlujo, pasoActivoFlujo } from '../../api/flujosCampo'
import { listarEtapasTareaCampo, obtenerTareaCampo } from '../../api/tareasCampo'
import { resolverTextoProductosPedido } from '../../flujo/productosPedido'
import { puedeCompletarPasoActivo } from '../../flujo/puedeCompletarPaso'
import {
  ETAPA_BODEGA_DESPACHO,
  ETAPA_BODEGA_RECEPCION,
  ETAPA_BODEGA_REVISION,
  ETAPA_COMPRAS,
  esEtapaFormularioPedido,
} from '../../flujo/etapasPedido'
import {
  construirRespuestaJsonConFirma,
  estadoFormPedidoInicial,
  validarCamposPedido,
  type FormPedidoState,
} from '../../flujo/respuestaPedidoFlujo'
import { useSession } from '../../context/SessionContext'
import type { FlujosStackParamList } from '../../navigation/types'
import type { EtapaTareaCampoDto } from '../../types/campo'
import { colors } from '../../theme/colors'

type R = RouteProp<FlujosStackParamList, 'FlujoActividad'>

function etiquetaRol(rol: string | null | undefined): string {
  if (!rol) return '—'
  const m: Record<string, string> = {
    COMERCIAL: 'Comercial',
    BODEGA: 'Bodega',
    COMPRAS: 'Compras',
    ADMINISTRADOR: 'Administrador',
    TECNICO: 'Técnico',
    SUPERVISOR: 'Supervisor',
  }
  return m[rol.toUpperCase()] ?? rol
}

export function FlujoActividadScreen() {
  const route = useRoute<R>()
  const { tareaId, titulo: tituloParam } = route.params
  const { roles } = useSession()
  const sigRef = useRef<SignatureViewRef>(null)
  const esperandoEnvio = useRef(false)

  const [titulo, setTitulo] = useState(tituloParam ?? '')
  const [estado, setEstado] = useState<string | null>(null)
  const [paso, setPaso] = useState<EtapaTareaCampoDto | null | undefined>(undefined)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formPedido, setFormPedido] = useState<FormPedidoState>(() => estadoFormPedidoInicial())
  const [productosPedidoLinea, setProductosPedidoLinea] = useState('')

  useEffect(() => {
    setFormPedido(estadoFormPedidoInicial())
  }, [paso?.id])

  const cargar = useCallback(async () => {
    setError(null)
    setCargando(true)
    try {
      const t = await obtenerTareaCampo(tareaId)
      setTitulo(t.titulo || tituloParam || `Actividad #${tareaId}`)
      setEstado(t.estado ?? null)
      const prod = await resolverTextoProductosPedido(t.descripcion, () => listarEtapasTareaCampo(tareaId))
      setProductosPedidoLinea(prod)
      const final = t.estado === 'TERMINADA' || t.estado === 'CANCELADA'
      if (final) {
        setPaso(null)
      } else {
        const p = await pasoActivoFlujo(tareaId)
        setPaso(p)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
      setPaso(null)
      setProductosPedidoLinea('')
    } finally {
      setCargando(false)
    }
  }, [tareaId, tituloParam])

  useFocusEffect(
    useCallback(() => {
      void cargar()
    }, [cargar]),
  )

  function onFirmaOK(data: string) {
    if (!esperandoEnvio.current) return
    esperandoEnvio.current = false
    if (!paso?.id) {
      setEnviando(false)
      return
    }
    void (async () => {
      try {
        const json = construirRespuestaJsonConFirma(paso.nombre, data, formPedido)
        await completarPasoFlujo(tareaId, paso.id, json)
        Alert.alert('Listo', 'Paso completado.', [{ text: 'OK', onPress: () => void cargar() }])
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo completar el paso')
      } finally {
        setEnviando(false)
      }
    })()
  }

  function onFirmaVacia() {
    esperandoEnvio.current = false
    setEnviando(false)
    Alert.alert('Firma', 'Dibuja tu firma en el recuadro antes de confirmar.')
  }

  function solicitarCompletar() {
    if (!paso?.id) return
    const errCampos = validarCamposPedido(paso.nombre, formPedido)
    if (errCampos) {
      Alert.alert('Revisa los datos', errCampos)
      return
    }
    esperandoEnvio.current = true
    setEnviando(true)
    sigRef.current?.readSignature()
  }

  if (cargando && paso === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const finalizada = estado === 'TERMINADA' || estado === 'CANCELADA'
  const puedoActuar = paso != null && puedeCompletarPasoActivo(roles, paso)

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.titulo}>{titulo}</Text>
      {estado ? <Text style={styles.estado}>Estado: {estado.replace(/_/g, ' ')}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {productosPedidoLinea ? (
        <View style={styles.productosBloque}>
          <Text style={styles.productosTit}>Productos del pedido</Text>
          <Text style={styles.productosTxt}>{productosPedidoLinea}</Text>
          <Text style={styles.productosHint}>Lo cargó Comercial al crear el pedido (misma información que en la web).</Text>
        </View>
      ) : null}

      {finalizada ? (
        <Text style={styles.muted}>Esta actividad ya finalizó. No hay paso para completar.</Text>
      ) : paso == null ? (
        <Text style={styles.muted}>No hay un paso activo (puede estar en espera de otro rol o sin turno).</Text>
      ) : !puedoActuar ? (
        <>
          <Text style={styles.pasoTit}>Paso actual</Text>
          <Text style={styles.pasoNombre}>{paso.nombre || `Paso #${paso.id}`}</Text>
          <Text style={styles.muted}>
            Este paso lo completa alguien con rol{' '}
            <Text style={styles.rolDestacado}>{etiquetaRol(paso.rolResponsable)}</Text>. Con tu cuenta no puedes firmar
            ni enviar este paso; no es tu turno. Vuelve cuando te corresponda o abre la actividad con un usuario que tenga
            ese rol.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.pasoTit}>Paso actual</Text>
          <Text style={styles.pasoNombre}>{paso.nombre || `Paso #${paso.id}`}</Text>
          {paso.formulario?.nombre ? (
            <Text style={styles.form}>Formulario: {paso.formulario.nombre}</Text>
          ) : null}

          {paso.nombre && esEtapaFormularioPedido(paso.nombre) ? (
            <>
              {paso.nombre === ETAPA_BODEGA_REVISION ? (
                <View style={styles.formBloque}>
                  <Text style={styles.campoTit}>¿El inventario cubre todo el pedido?</Text>
                  <View style={styles.chipRow}>
                    <Pressable
                      style={[styles.chip, formPedido.bodegaInv === 'SI' && styles.chipOn]}
                      onPress={() => setFormPedido((f) => ({ ...f, bodegaInv: 'SI' }))}
                    >
                      <Text style={[styles.chipText, formPedido.bodegaInv === 'SI' && styles.chipTextOn]}>Sí</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.chip, formPedido.bodegaInv === 'NO' && styles.chipOn]}
                      onPress={() => setFormPedido((f) => ({ ...f, bodegaInv: 'NO' }))}
                    >
                      <Text style={[styles.chipText, formPedido.bodegaInv === 'NO' && styles.chipTextOn]}>No</Text>
                    </Pressable>
                  </View>
                  {formPedido.bodegaInv === 'NO' ? (
                    <>
                      <Text style={[styles.campoTit, { marginTop: 14 }]}>Productos faltantes</Text>
                      <TextInput
                        style={styles.input}
                        multiline
                        value={formPedido.productosFaltantes}
                        onChangeText={(t) => setFormPedido((f) => ({ ...f, productosFaltantes: t }))}
                        placeholder="Qué falta para completar el pedido"
                        placeholderTextColor={colors.muted}
                      />
                    </>
                  ) : null}
                </View>
              ) : null}

              {paso.nombre === ETAPA_COMPRAS ? (
                <View style={styles.formBloque}>
                  <Text style={styles.campoTit}>Confirmaciones (las tres deben estar activas)</Text>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Cotizaciones solicitadas</Text>
                    <Switch
                      value={formPedido.cotizacionesSolicitadas}
                      onValueChange={(v) => setFormPedido((f) => ({ ...f, cotizacionesSolicitadas: v }))}
                      trackColor={{ true: colors.primaryMuted, false: colors.border }}
                      thumbColor={formPedido.cotizacionesSolicitadas ? colors.primary : colors.muted}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Orden de compra generada</Text>
                    <Switch
                      value={formPedido.ordenCompraGenerada}
                      onValueChange={(v) => setFormPedido((f) => ({ ...f, ordenCompraGenerada: v }))}
                      trackColor={{ true: colors.primaryMuted, false: colors.border }}
                      thumbColor={formPedido.ordenCompraGenerada ? colors.primary : colors.muted}
                    />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Compra realizada</Text>
                    <Switch
                      value={formPedido.compraRealizada}
                      onValueChange={(v) => setFormPedido((f) => ({ ...f, compraRealizada: v }))}
                      trackColor={{ true: colors.primaryMuted, false: colors.border }}
                      thumbColor={formPedido.compraRealizada ? colors.primary : colors.muted}
                    />
                  </View>
                </View>
              ) : null}

              {paso.nombre === ETAPA_BODEGA_RECEPCION ? (
                <View style={styles.formBloque}>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Productos recibidos en bodega</Text>
                    <Switch
                      value={formPedido.productosRecibidos}
                      onValueChange={(v) => setFormPedido((f) => ({ ...f, productosRecibidos: v }))}
                      trackColor={{ true: colors.primaryMuted, false: colors.border }}
                      thumbColor={formPedido.productosRecibidos ? colors.primary : colors.muted}
                    />
                  </View>
                </View>
              ) : null}

              {paso.nombre === ETAPA_BODEGA_DESPACHO ? (
                <View style={styles.formBloque}>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Despacho realizado</Text>
                    <Switch
                      value={formPedido.despachoRealizado}
                      onValueChange={(v) => setFormPedido((f) => ({ ...f, despachoRealizado: v }))}
                      trackColor={{ true: colors.primaryMuted, false: colors.border }}
                      thumbColor={formPedido.despachoRealizado ? colors.primary : colors.muted}
                    />
                  </View>
                  <Text style={[styles.campoTit, { marginTop: 14 }]}>Observación (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    multiline
                    value={formPedido.observacionDespacho}
                    onChangeText={(t) => setFormPedido((f) => ({ ...f, observacionDespacho: t }))}
                    placeholder="Notas del despacho"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              ) : null}
            </>
          ) : null}

          <Text style={styles.leyenda}>
            {paso.nombre && esEtapaFormularioPedido(paso.nombre)
              ? 'Completa los datos arriba y firma abajo. El servidor valida ambos al cerrar el paso.'
              : 'Firma abajo como en la web. El servidor exige una firma en imagen para cerrar el paso.'}
          </Text>
          <View style={styles.sigWrap}>
            <SignatureCanvas
              ref={sigRef}
              onOK={onFirmaOK}
              onEmpty={onFirmaVacia}
              penColor={colors.pen}
              backgroundColor={colors.canvasBg}
              descriptionText="Firma aquí"
              clearText="Borrar"
              confirmText=""
              autoClear={false}
              nestedScrollEnabled
              style={styles.sigCanvas}
            />
          </View>
          <Pressable
            style={[styles.boton, enviando && styles.botonDisabled]}
            onPress={solicitarCompletar}
            disabled={enviando}
          >
            <Text style={styles.botonTexto}>{enviando ? 'Enviando…' : 'Completar paso con esta firma'}</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  titulo: { fontSize: 20, fontWeight: '700', color: colors.text },
  estado: { marginTop: 8, color: colors.primary, fontWeight: '600' },
  error: { color: colors.danger, marginTop: 12 },
  muted: { marginTop: 16, color: colors.muted, lineHeight: 22, fontSize: 15 },
  rolDestacado: { fontWeight: '700', color: colors.text },
  pasoTit: { marginTop: 24, fontSize: 13, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  pasoNombre: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 4 },
  form: { fontSize: 14, color: colors.muted, marginTop: 8 },
  leyenda: { fontSize: 13, color: colors.muted, marginTop: 14, lineHeight: 19 },
  formBloque: { marginTop: 16 },
  campoTit: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 10 },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  chipText: { fontSize: 15, fontWeight: '600', color: colors.muted },
  chipTextOn: { color: colors.primary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 4,
  },
  switchLabel: { flex: 1, fontSize: 15, color: colors.text, paddingRight: 12 },
  productosBloque: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productosTit: { fontSize: 13, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.4 },
  productosTxt: { marginTop: 8, fontSize: 16, fontWeight: '600', color: colors.text, lineHeight: 22 },
  productosHint: { marginTop: 8, fontSize: 12, color: colors.muted, lineHeight: 17 },
  sigWrap: {
    marginTop: 16,
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvasBg,
  },
  sigCanvas: { flex: 1, width: '100%', height: '100%' },
  boton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonDisabled: { opacity: 0.65 },
  botonTexto: { color: '#fff', fontWeight: '600', fontSize: 16 },
})
