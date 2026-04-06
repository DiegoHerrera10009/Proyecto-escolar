import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { esAdministrador, mostrarInventarioYFormularios } from '../auth/roles'
import { useSession } from '../context/SessionContext'
import type { MasStackParamList } from '../navigation/types'
import { NombreConRol } from '../components/IndicadorRol'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<MasStackParamList, 'MasHome'>

export function MasScreen() {
  const navigation = useNavigation<Nav>()
  const { correo, roles, logout } = useSession()
  const admin = esAdministrador(roles)
  const inv = mostrarInventarioYFormularios(roles)

  return (
    <View style={styles.root}>
      <NombreConRol nombre={correo} roles={roles} nombreSize="large" />
      <Text style={styles.sec}>Secciones (versión móvil)</Text>

      {inv ? (
        <>
          <Row
            titulo="Inventario"
            onPress={() =>
              navigation.navigate('Placeholder', {
                titulo: 'Inventario',
                descripcion:
                  'En la app móvil todavía no replicamos el ABM de inventario. Usá el navegador con la misma cuenta para cargas y ediciones completas.',
              })
            }
          />
          <Row
            titulo="Formularios dinámicos"
            onPress={() =>
              navigation.navigate('Placeholder', {
                titulo: 'Formularios',
                descripcion:
                  'El diseño de formularios y respuestas detalladas sigue en la web. Desde el celular podés ejecutar flujos que usan esos formularios en la pestaña Flujos.',
              })
            }
          />
        </>
      ) : null}

      {admin ? (
        <>
          <Row
            titulo="Usuarios y roles"
            onPress={() =>
              navigation.navigate('Placeholder', {
                titulo: 'Usuarios',
                descripcion: 'El alta y edición de usuarios está disponible en el panel web (módulo Usuarios).',
              })
            }
          />
          <Row titulo="Monitoreo de ejecuciones" onPress={() => navigation.navigate('AdminEjecuciones')} />
        </>
      ) : null}

      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  )
}

function Row({ titulo, onPress }: { titulo: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <Text style={styles.rowText}>{titulo}</Text>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  sec: { marginTop: 20, marginBottom: 10, fontSize: 13, color: colors.muted, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowText: { fontSize: 16, color: colors.text, fontWeight: '600' },
  chev: { fontSize: 22, color: colors.muted },
  logout: {
    marginTop: 28,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontWeight: '600', fontSize: 16 },
})
