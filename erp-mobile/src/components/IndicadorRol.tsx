import type { StyleProp, ViewStyle } from 'react-native'
import { StyleSheet, Text, View } from 'react-native'

import { colors } from '../theme/colors'

const ETIQUETA_ROL: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  SUPERVISOR: 'Supervisor',
  TECNICO: 'Técnico',
}

const ORDEN_ROL = ['ADMINISTRADOR', 'SUPERVISOR', 'TECNICO']

function etiquetaRol(codigo: string): string {
  const k = codigo.trim().toUpperCase()
  return ETIQUETA_ROL[k] ?? codigo
}

/** Texto legible de roles, ordenados (admin / supervisor / técnico primero). */
export function textoRolesLegibles(roles: string[]): string {
  if (roles.length === 0) return 'Sin rol asignado'
  const ordenados = [...roles].sort((a, b) => {
    const ia = ORDEN_ROL.indexOf(a.trim().toUpperCase())
    const ib = ORDEN_ROL.indexOf(b.trim().toUpperCase())
    const pa = ia === -1 ? 999 : ia
    const pb = ib === -1 ? 999 : ib
    return pa - pb
  })
  return ordenados.map((r) => etiquetaRol(r)).join(' · ')
}

type Props = {
  /** Correo o nombre a mostrar */
  nombre: string
  roles: string[]
  style?: StyleProp<ViewStyle>
  /** Tamaño del nombre (el rol va al lado con estilo verde tipo chip) */
  nombreSize?: 'normal' | 'large'
}

/**
 * Muestra `correo —` y el rol en pastilla verde (como el indicador anterior).
 */
export function NombreConRol({ nombre, roles, style, nombreSize = 'normal' }: Props) {
  const rolesTexto = textoRolesLegibles(roles)
  return (
    <View style={[styles.fila, nombreSize === 'large' && styles.filaLarge, style]}>
      <Text style={styles.nombreBloque} numberOfLines={2}>
        <Text style={[styles.nombre, nombreSize === 'large' && styles.nombreLarge]}>{nombre}</Text>
        <Text style={[styles.sep, nombreSize === 'large' && styles.sepLarge]}> — </Text>
      </Text>
      <View style={styles.rolPill}>
        <Text style={[styles.rol, nombreSize === 'large' && styles.rolLarge]}>{rolesTexto}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  filaLarge: {
    marginTop: 4,
  },
  nombreBloque: {
    flexShrink: 1,
  },
  nombre: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  nombreLarge: {
    fontSize: 20,
  },
  sep: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.muted,
  },
  sepLarge: { fontSize: 17 },
  rolPill: {
    backgroundColor: colors.rolVerdeFondo,
    borderWidth: 1,
    borderColor: colors.rolVerdeBorde,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  rol: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.rolVerde,
  },
  rolLarge: {
    fontSize: 15,
  },
})
