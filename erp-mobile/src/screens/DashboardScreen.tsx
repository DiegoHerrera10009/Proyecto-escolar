import { useCallback, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { listarTareasCampo } from '../api/tareasCampo'
import { misActividadesActivas } from '../api/flujosCampo'
import { NombreConRol } from '../components/IndicadorRol'
import { useSession } from '../context/SessionContext'
import { colors } from '../theme/colors'

export function DashboardScreen() {
  const { correo, roles } = useSession()
  const [nTareas, setNTareas] = useState<number | null>(null)
  const [nActivas, setNActivas] = useState<number | null>(null)
  const [cargando, setCargando] = useState(false)
  const [refrescando, setRefrescando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [tareas, activas] = await Promise.all([listarTareasCampo(), misActividadesActivas()])
      const soloEjecucion = tareas.filter((t) => !t.esPlantillaFlujo)
      setNTareas(soloEjecucion.length)
      setNActivas(activas.length)
    } catch {
      setNTareas(null)
      setNActivas(null)
    } finally {
      setCargando(false)
    }
  }, [])

  const refrescar = useCallback(async () => {
    setRefrescando(true)
    try {
      await cargar()
    } finally {
      setRefrescando(false)
    }
  }, [cargar])

  useFocusEffect(
    useCallback(() => {
      void cargar()
    }, [cargar]),
  )

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} tintColor={colors.accent} />}
    >
      <Text style={styles.saludo}>Hola</Text>
      <NombreConRol nombre={correo} roles={roles} nombreSize="large" />

      {cargando && nTareas === null ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardValor}>{nTareas ?? '—'}</Text>
            <Text style={styles.cardTitulo}>Tareas de campo (ejecuciones)</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValor}>{nActivas ?? '—'}</Text>
            <Text style={styles.cardTitulo}>Mis actividades activas</Text>
          </View>
        </View>
      )}

      <Text style={styles.hint}>
        Usá las pestañas inferiores para ver el listado completo, iniciar flujos desde el menú y abrir el resto de secciones.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  saludo: { fontSize: 14, color: colors.muted },
  cards: { flexDirection: 'row', gap: 12, marginTop: 24 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardValor: { fontSize: 28, fontWeight: '700', color: colors.text },
  cardTitulo: { fontSize: 12, color: colors.muted, marginTop: 6 },
  hint: { fontSize: 14, color: colors.muted, marginTop: 24, lineHeight: 21 },
})
