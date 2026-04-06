import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useFocusEffect, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'

import {
  cambiarEstadoTareaCampo,
  historialTareaCampo,
  obtenerTareaCampo,
} from '../api/tareasCampo'
import { useSession } from '../context/SessionContext'
import type { TareasStackParamList } from '../navigation/types'
import { esAdministrador, esSupervisor } from '../auth/roles'
import type { EstadoTareaCampo } from '../types/campo'
import { colors } from '../theme/colors'

type R = RouteProp<TareasStackParamList, 'TareaDetail'>

const OPCIONES_ESTADO: EstadoTareaCampo[] = [
  'PENDIENTE',
  'EN_PROCESO',
  'PENDIENTE_APROBACION',
  'TERMINADA',
  'CANCELADA',
]

function etiquetaEstado(e: EstadoTareaCampo): string {
  const map: Record<string, string> = {
    BORRADOR: 'Borrador',
    PUBLICADA: 'Publicada',
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En proceso',
    PENDIENTE_APROBACION: 'Pendiente de aprobación',
    TERMINADA: 'Terminada',
    CANCELADA: 'Cancelada',
  }
  return map[e] ?? e
}

export function TareaDetailScreen() {
  const route = useRoute<R>()
  const { roles } = useSession()
  const tareaId = route.params.tareaId

  const [tarea, setTarea] = useState<Awaited<ReturnType<typeof obtenerTareaCampo>> | null>(null)
  const [historial, setHistorial] = useState<Awaited<ReturnType<typeof historialTareaCampo>>>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalEstado, setModalEstado] = useState(false)
  const [comentario, setComentario] = useState('')
  const [guardando, setGuardando] = useState(false)

  const puedeCancelar = esAdministrador(roles) || esSupervisor(roles)

  const estadosDisponibles = useMemo(() => {
    return OPCIONES_ESTADO.filter((e) => e !== 'CANCELADA' || puedeCancelar)
  }, [puedeCancelar])

  const cargar = useCallback(async () => {
    setError(null)
    setCargando(true)
    try {
      const [t, h] = await Promise.all([obtenerTareaCampo(tareaId), historialTareaCampo(tareaId)])
      setTarea(t)
      setHistorial(h)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
      setTarea(null)
    } finally {
      setCargando(false)
    }
  }, [tareaId])

  useFocusEffect(
    useCallback(() => {
      void cargar()
    }, [cargar]),
  )

  async function aplicarEstado(nuevo: EstadoTareaCampo) {
    if (nuevo === 'CANCELADA' && !comentario.trim()) {
      setError('Para cancelar indicá un comentario con el motivo.')
      setModalEstado(false)
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const actualizada = await cambiarEstadoTareaCampo(tareaId, {
        estadoNuevo: nuevo,
        comentario: comentario.trim() || undefined,
      })
      setTarea(actualizada)
      setComentario('')
      setModalEstado(false)
      const h = await historialTareaCampo(tareaId)
      setHistorial(h)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando && !tarea) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  if (!tarea) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Tarea no encontrada'}</Text>
      </View>
    )
  }

  const estadoActual = tarea.estado ?? 'PENDIENTE'
  const finalizada = estadoActual === 'TERMINADA' || estadoActual === 'CANCELADA'

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.titulo}>{tarea.titulo || `Tarea #${tarea.id}`}</Text>
      <Text style={styles.estadoActual}>Estado: {etiquetaEstado(estadoActual)}</Text>
      {tarea.descripcion ? <Text style={styles.desc}>{tarea.descripcion}</Text> : null}
      {tarea.asignadoA?.nombreCompleto ? (
        <Text style={styles.meta}>Asignada a: {tarea.asignadoA.nombreCompleto}</Text>
      ) : null}

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      {!finalizada ? (
        <>
          <Pressable
            style={[styles.boton, guardando && styles.botonDisabled]}
            onPress={() => setModalEstado(true)}
            disabled={guardando}
          >
            <Text style={styles.botonTexto}>Cambiar estado</Text>
          </Pressable>
          <Text style={styles.labelComentario}>Comentario (obligatorio si cancelás)</Text>
          <TextInput
            style={styles.input}
            placeholder="Motivo o nota…"
            placeholderTextColor={colors.muted}
            value={comentario}
            onChangeText={setComentario}
            multiline
          />
        </>
      ) : (
        <Text style={styles.avisoFinal}>Esta tarea ya está cerrada; no se puede cambiar el estado desde acá.</Text>
      )}

      <Text style={styles.secTitulo}>Historial</Text>
      {historial.length === 0 ? (
        <Text style={styles.muted}>Sin movimientos registrados.</Text>
      ) : (
        historial.map((h) => (
          <View key={h.id} style={styles.hItem}>
            <Text style={styles.hFecha}>{h.fechaRegistro?.replace('T', ' ').slice(0, 19) ?? '—'}</Text>
            <Text style={styles.hTexto}>
              {etiquetaEstado(h.estadoAnterior ?? 'PENDIENTE')} → {etiquetaEstado(h.estadoNuevo ?? 'PENDIENTE')}
            </Text>
            {h.comentario ? <Text style={styles.hCom}>{h.comentario}</Text> : null}
            {h.usuario?.nombreCompleto ? (
              <Text style={styles.hUser}>{h.usuario.nombreCompleto}</Text>
            ) : null}
          </View>
        ))
      )}

      <Modal visible={modalEstado} transparent animationType="fade" onRequestClose={() => setModalEstado(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalEstado(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitulo}>Nuevo estado</Text>
            {estadosDisponibles.map((e) => (
              <Pressable
                key={e}
                style={styles.modalRow}
                onPress={() => void aplicarEstado(e)}
                disabled={guardando}
              >
                <Text style={styles.modalRowText}>{etiquetaEstado(e)}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.modalCancel} onPress={() => setModalEstado(false)}>
              <Text style={styles.modalCancelText}>Cerrar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, padding: 24 },
  titulo: { fontSize: 22, fontWeight: '700', color: colors.text },
  estadoActual: { fontSize: 15, color: colors.accent, marginTop: 8, fontWeight: '600' },
  desc: { fontSize: 15, color: colors.muted, marginTop: 12, lineHeight: 22 },
  meta: { fontSize: 14, color: colors.muted, marginTop: 10 },
  error: { color: colors.danger, textAlign: 'center' },
  errorBanner: { color: colors.danger, marginTop: 12 },
  boton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonDisabled: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontWeight: '600', fontSize: 16 },
  labelComentario: { marginTop: 16, color: colors.muted, fontSize: 13 },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    minHeight: 72,
    textAlignVertical: 'top',
    backgroundColor: colors.card,
  },
  avisoFinal: { marginTop: 16, color: colors.muted, fontSize: 14, lineHeight: 20 },
  secTitulo: { marginTop: 28, fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 10 },
  muted: { color: colors.muted },
  hItem: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hFecha: { fontSize: 11, color: colors.muted },
  hTexto: { fontSize: 14, color: colors.text, marginTop: 4, fontWeight: '600' },
  hCom: { fontSize: 13, color: colors.muted, marginTop: 6 },
  hUser: { fontSize: 12, color: colors.accent, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitulo: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
  modalRow: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  modalRowText: { fontSize: 16, color: colors.text },
  modalCancel: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  modalCancelText: { color: colors.accent, fontWeight: '600' },
})
