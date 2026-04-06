import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { listarTareasCampo } from '../api/tareasCampo'
import type { TareasStackParamList } from '../navigation/types'
import type { EstadoTareaCampo, TareaCampoResumen } from '../types/campo'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<TareasStackParamList, 'TareasList'>

function etiquetaEstado(e: EstadoTareaCampo | null | undefined): string {
  if (!e) return '—'
  const map: Record<string, string> = {
    BORRADOR: 'Borrador',
    PUBLICADA: 'Publicada',
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En proceso',
    PENDIENTE_APROBACION: 'Pend. aprobación',
    TERMINADA: 'Terminada',
    CANCELADA: 'Cancelada',
  }
  return map[e] ?? e
}

export function TareasListScreen() {
  const navigation = useNavigation<Nav>()
  const [items, setItems] = useState<TareaCampoResumen[]>([])
  const [cargando, setCargando] = useState(true)
  const [refrescando, setRefrescando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setError(null)
    try {
      const data = await listarTareasCampo()
      setItems(data.filter((t) => !t.esPlantillaFlujo))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
      setItems([])
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
      setCargando(true)
      void cargar()
    }, [cargar]),
  )

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
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} tintColor={colors.accent} />
        }
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={<Text style={styles.vacio}>No hay tareas para mostrar.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => navigation.navigate('TareaDetail', { tareaId: item.id })}
          >
            <Text style={styles.titulo} numberOfLines={2}>
              {item.titulo || `Tarea #${item.id}`}
            </Text>
            <View style={styles.meta}>
              <Text style={styles.estado}>{etiquetaEstado(item.estado)}</Text>
              {item.asignadoA?.nombreCompleto ? (
                <Text style={styles.asignado} numberOfLines={1}>
                  {item.asignadoA.nombreCompleto}
                </Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  list: { padding: 16, paddingBottom: 32, gap: 10 },
  emptyList: { flexGrow: 1, padding: 16, justifyContent: 'center' },
  error: { color: colors.danger, paddingHorizontal: 16, paddingTop: 12 },
  vacio: { color: colors.muted, textAlign: 'center' },
  row: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowPressed: { opacity: 0.85 },
  titulo: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 },
  estado: { fontSize: 13, color: colors.accent, fontWeight: '600' },
  asignado: { fontSize: 12, color: colors.muted, flex: 1, textAlign: 'right' },
})
