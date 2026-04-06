import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import {
  iniciarFlujoDesdeMenu,
  menuFlujos,
  misActividadesActivas,
  misActividadesHistorial,
  misActividadesSeguimiento,
  type SeccionMenu,
} from '../../api/flujosCampo'
import { esAdministrador } from '../../auth/roles'
import { useSession } from '../../context/SessionContext'
import { filtrarMenuFlujo, filtrarPorSeccion } from '../../flujo/filtrarPanelUsuario'
import type { FlujosStackParamList } from '../../navigation/types'
import type { TareaCampoResumen } from '../../types/campo'
import { NombreConRol } from '../../components/IndicadorRol'
import { colors } from '../../theme/colors'

type Nav = NativeStackNavigationProp<FlujosStackParamList, 'FlujosHome'>

type Segmento = 'disponibles' | 'mis' | 'historial'

function etiquetaEstado(estado: string | null | undefined): string {
  if (!estado) return '—'
  const m: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En proceso',
    PENDIENTE_APROBACION: 'Pend. aprobación',
    TERMINADA: 'Terminada',
    CANCELADA: 'Cancelada',
    BORRADOR: 'Borrador',
    PUBLICADA: 'Publicada',
  }
  return m[estado] ?? estado
}

export function FlujosHomeScreen() {
  const navigation = useNavigation<Nav>()
  const { correo, roles } = useSession()
  const esAdmin = esAdministrador(roles)
  const [segmento, setSegmento] = useState<Segmento>('disponibles')
  const [seccion, setSeccion] = useState<SeccionMenu>('OPERATIVOS')
  const [menuItems, setMenuItems] = useState<TareaCampoResumen[]>([])
  const [activas, setActivas] = useState<TareaCampoResumen[]>([])
  const [seguimiento, setSeguimiento] = useState<TareaCampoResumen[]>([])
  const [historial, setHistorial] = useState<TareaCampoResumen[]>([])
  const [cargando, setCargando] = useState(false)
  const [refrescando, setRefrescando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarSegmento = useCallback(async () => {
    setError(null)
    try {
      if (segmento === 'disponibles') {
        const m = await menuFlujos(seccion)
        setMenuItems(m)
      } else if (segmento === 'mis') {
        const [a, s] = await Promise.all([misActividadesActivas(), misActividadesSeguimiento()])
        setActivas(a)
        setSeguimiento(s)
      } else {
        const h = await misActividadesHistorial()
        setHistorial(h)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    }
  }, [segmento, seccion])

  const refrescar = useCallback(async () => {
    setRefrescando(true)
    try {
      await cargarSegmento()
    } finally {
      setRefrescando(false)
    }
  }, [cargarSegmento])

  useEffect(() => {
    let ok = true
    setCargando(true)
    void (async () => {
      await cargarSegmento()
      if (ok) setCargando(false)
    })()
    return () => {
      ok = false
    }
  }, [segmento, seccion, cargarSegmento])

  useFocusEffect(
    useCallback(() => {
      void cargarSegmento()
    }, [cargarSegmento]),
  )

  const menuFiltrado = useMemo(
    () => filtrarMenuFlujo(menuItems, roles, esAdmin, seccion),
    [menuItems, roles, esAdmin, seccion],
  )
  const activasF = useMemo(() => filtrarPorSeccion(activas, seccion), [activas, seccion])
  const seguimientoF = useMemo(() => filtrarPorSeccion(seguimiento, seccion), [seguimiento, seccion])
  const historialF = useMemo(() => filtrarPorSeccion(historial, seccion), [historial, seccion])

  function confirmarIniciar(item: TareaCampoResumen) {
    Alert.alert(
      'Iniciar actividad',
      `¿Querés iniciar «${item.titulo || 'flujo'}»?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: () =>
            void (async () => {
              try {
                const t = await iniciarFlujoDesdeMenu(item.id)
                setSegmento('mis')
                navigation.navigate('FlujoActividad', { tareaId: t.id, titulo: t.titulo ?? undefined })
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo iniciar')
              }
            })(),
        },
      ],
    )
  }

  type FilaMis = { tipo: 'h'; titulo: string } | { tipo: 't'; item: TareaCampoResumen }
  const filasMis: FilaMis[] =
    segmento === 'mis'
      ? [
          { tipo: 'h', titulo: 'En tu turno (podés completar el paso)' },
          ...activasF.map((item) => ({ tipo: 't' as const, item })),
          { tipo: 'h', titulo: 'Seguimiento' },
          ...seguimientoF.map((item) => ({ tipo: 't' as const, item })),
        ]
      : []

  return (
    <View style={styles.root}>
      <NombreConRol nombre={correo} roles={roles} style={styles.cabeceraUsuario} />
      <View style={styles.tabs}>
        {(['disponibles', 'mis', 'historial'] as const).map((s) => (
          <Pressable
            key={s}
            style={[styles.tab, segmento === s && styles.tabOn]}
            onPress={() => setSegmento(s)}
          >
            <Text style={[styles.tabText, segmento === s && styles.tabTextOn]}>
              {s === 'disponibles'
                ? `Disponibles (${menuFiltrado.length})`
                : s === 'mis'
                  ? `Mis actividades (${activasF.length + seguimientoF.length})`
                  : `Historial (${historialF.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {segmento === 'disponibles' ? (
        <View style={styles.seccionRow}>
          {(['OPERATIVOS', 'FLOTA'] as const).map((sec) => (
            <Pressable key={sec} style={[styles.chip, seccion === sec && styles.chipOn]} onPress={() => setSeccion(sec)}>
              <Text style={[styles.chipText, seccion === sec && styles.chipTextOn]}>
                {sec === 'OPERATIVOS' ? 'Operativos' : 'Flota'}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {cargando && segmento === 'disponibles' && menuItems.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : null}

      {segmento === 'disponibles' ? (
        <FlatList
          data={menuFiltrado}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            cargando ? null : <Text style={styles.vacio}>No hay flujos disponibles en esta sección.</Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => confirmarIniciar(item)}>
              <Text style={styles.rowTit}>{item.titulo || `Plantilla #${item.id}`}</Text>
              <Text style={styles.rowSub}>Iniciar nueva ejecución</Text>
            </Pressable>
          )}
        />
      ) : null}

      {segmento === 'mis' ? (
        activasF.length === 0 && seguimientoF.length === 0 ? (
          <ScrollView
            contentContainerStyle={[styles.list, { flexGrow: 1 }]}
            refreshControl={
              <RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} tintColor={colors.primary} />
            }
          >
            <Text style={styles.vacio}>No tenés actividades en esta sección.</Text>
          </ScrollView>
        ) : (
          <FlatList
            data={filasMis}
            keyExtractor={(row, i) => (row.tipo === 'h' ? `h-${row.titulo}` : `t-${row.item.id}-${i}`)}
            refreshControl={
              <RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} tintColor={colors.primary} />
            }
            contentContainerStyle={styles.list}
            renderItem={({ item: row }) =>
              row.tipo === 'h' ? (
                <Text style={[styles.secTit, { marginTop: row.titulo.startsWith('Seguimiento') ? 16 : 0 }]}>
                  {row.titulo}
                </Text>
              ) : (
                <Pressable
                  style={styles.row}
                  onPress={() =>
                    navigation.navigate('FlujoActividad', {
                      tareaId: row.item.id,
                      titulo: row.item.titulo ?? undefined,
                    })
                  }
                >
                  <Text style={styles.rowTit}>{row.item.titulo || `Actividad #${row.item.id}`}</Text>
                  <Text style={styles.rowSub}>{etiquetaEstado(row.item.estado ?? undefined)}</Text>
                </Pressable>
              )
            }
          />
        )
      ) : null}

      {segmento === 'historial' ? (
        <FlatList
          data={historialF}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            cargando ? null : <Text style={styles.vacio}>Sin historial reciente.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.navigate('FlujoActividad', { tareaId: item.id, titulo: item.titulo ?? undefined })
              }
            >
              <Text style={styles.rowTit}>{item.titulo || `Actividad #${item.id}`}</Text>
              <Text style={styles.rowSub}>{etiquetaEstado(item.estado ?? undefined)}</Text>
            </Pressable>
          )}
        />
      ) : null}
    </View>
  )
}

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 3,
  elevation: 2,
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  cabeceraUsuario: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  tabs: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 8, gap: 6 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabOn: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  tabText: { fontSize: 11, color: colors.muted, fontWeight: '600', textAlign: 'center' },
  tabTextOn: { color: colors.primary },
  seccionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextOn: { color: colors.primary },
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
    ...cardShadow,
  },
  rowTit: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 13, color: colors.muted, marginTop: 4 },
  secTit: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 8 },
})
