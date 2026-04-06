import { StyleSheet, Text, View } from 'react-native'
import { useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'

import type { MasStackParamList } from '../navigation/types'
import { colors } from '../theme/colors'

type R = RouteProp<MasStackParamList, 'Placeholder'>

export function PlaceholderScreen() {
  const route = useRoute<R>()
  const { titulo, descripcion } = route.params
  return (
    <View style={styles.root}>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.desc}>{descripcion}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 24 },
  titulo: { fontSize: 20, fontWeight: '700', color: colors.text },
  desc: { marginTop: 14, fontSize: 15, color: colors.muted, lineHeight: 22 },
})
