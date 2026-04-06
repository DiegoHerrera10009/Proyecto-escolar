import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors } from '../theme/colors'

type Props = {
  correo: string
  onLogout: () => void
}

/** Pantalla legacy; la app usa MainNavigator. Mantenemos estilos alineados al tema claro. */
export function HomeScreen({ correo, onLogout }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.titulo}>Sesión iniciada</Text>
      <Text style={styles.sub}>{correo}</Text>
      <Text style={styles.hint}>
        Desde acá podés sumar pantallas (tareas, inventario, etc.) llamando a la misma API que la web.
      </Text>
      <Pressable style={styles.boton} onPress={onLogout}>
        <Text style={styles.botonTexto}>Cerrar sesión</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 16,
  },
  hint: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 24,
  },
  boton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  botonTexto: {
    color: colors.text,
    fontWeight: '600',
  },
})
