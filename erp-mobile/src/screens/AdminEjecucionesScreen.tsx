import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { listarEjecucionesAdmin } from '../api/flujosCampo'
import type { TareaCampoResumen } from '../types/campo'
import { colors } from '../theme/colors'

export function AdminEjecucionesScreen() {
  const [items, setItems] = useState<TareaCampoResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setError(null)
    try {
      const data = await listarEjecucionesAdmin()
      setItems(data.filter((t) => !t.esPlantillaFlujo))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sin acceso o error')
      setItems([])
    } finally {
      setCargando(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      setCargando(true)
      void cargar()
    }, [cargar]),
  )

  const refrescar = useCallback(async () => {
    setRefrescando(true)
    try {
      await cargar()
    } finally {
      setRefrescando(false)
    }
  }, [cargar])

  if (cargando && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.sub}>Ejecuciones de flujo (solo administrador).</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} tintColor={colors.accent} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.vacio}>No hay ejecuciones o no tienes permiso.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowTit}>{item.titulo || `#${item.id}`}</Text>
            <Text style={styles.rowSub}>{item.estado?.replace(/_/g, ' ') ?? '—'}</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  sub: { color: colors.muted, paddingHorizontal: 16, paddingTop: 8, fontSize: 13 },
  error: { color: colors.danger, paddingHorizontal: 16, paddingTop: 8 },
  list: { padding: 16, paddingBottom: 32 },
  vacio: { color: colors.muted, textAlign: 'center', marginTop: 24 },
  row: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTit: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 13, color: colors.accent, marginTop: 4 },
})
