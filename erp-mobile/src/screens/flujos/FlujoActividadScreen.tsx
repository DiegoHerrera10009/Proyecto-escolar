import { useCallback, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native'
import { useFocusEffect, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import SignatureCanvas from 'react-native-signature-canvas'
import type { SignatureViewRef } from 'react-native-signature-canvas'

import { completarPasoFlujo, pasoActivoFlujo } from '../../api/flujosCampo'
import { obtenerTareaCampo } from '../../api/tareasCampo'
import type { FlujosStackParamList } from '../../navigation/types'
import type { EtapaTareaCampoDto } from '../../types/campo'
import { colors } from '../../theme/colors'

type R = RouteProp<FlujosStackParamList, 'FlujoActividad'>

function firmaJson(dataUrl: string): string {
  const firma = dataUrl.startsWith('data:image/') ? dataUrl : `data:image/png;base64,${dataUrl}`
  return JSON.stringify({ firmaSistema: firma })
}

export function FlujoActividadScreen() {
  const route = useRoute<R>()
  const { tareaId, titulo: tituloParam } = route.params
  const sigRef = useRef<SignatureViewRef>(null)
  const esperandoEnvio = useRef(false)

  const [titulo, setTitulo] = useState(tituloParam ?? '')
  const [estado, setEstado] = useState<string | null>(null)
  const [paso, setPaso] = useState<EtapaTareaCampoDto | null | undefined>(undefined)
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setError(null)
    setCargando(true)
    try {
      const t = await obtenerTareaCampo(tareaId)
      setTitulo(t.titulo || tituloParam || `Actividad #${tareaId}`)
      setEstado(t.estado ?? null)
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
        await completarPasoFlujo(tareaId, paso.id, firmaJson(data))
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
    Alert.alert('Firma', 'Dibujá tu firma en el recuadro antes de confirmar.')
  }

  function solicitarCompletar() {
    if (!paso?.id) return
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

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.titulo}>{titulo}</Text>
      {estado ? <Text style={styles.estado}>Estado: {estado.replace(/_/g, ' ')}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {finalizada ? (
        <Text style={styles.muted}>Esta actividad ya finalizó. No hay paso para completar.</Text>
      ) : paso == null ? (
        <Text style={styles.muted}>No hay un paso activo (puede estar en espera de otro rol o sin turno).</Text>
      ) : (
        <>
          <Text style={styles.pasoTit}>Paso actual</Text>
          <Text style={styles.pasoNombre}>{paso.nombre || `Paso #${paso.id}`}</Text>
          {paso.formulario?.nombre ? (
            <Text style={styles.form}>Formulario: {paso.formulario.nombre}</Text>
          ) : null}
          <Text style={styles.leyenda}>
            Firmá abajo como en la web. El servidor exige una firma en imagen para cerrar el paso.
          </Text>
          <View style={styles.sigWrap}>
            <SignatureCanvas
              ref={sigRef}
              onOK={onFirmaOK}
              onEmpty={onFirmaVacia}
              penColor={colors.pen}
              backgroundColor={colors.canvasBg}
              descriptionText="Firma acá"
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
  pasoTit: { marginTop: 24, fontSize: 13, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  pasoNombre: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 4 },
  form: { fontSize: 14, color: colors.muted, marginTop: 8 },
  leyenda: { fontSize: 13, color: colors.muted, marginTop: 14, lineHeight: 19 },
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
