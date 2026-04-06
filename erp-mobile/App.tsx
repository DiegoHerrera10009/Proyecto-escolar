import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { DefaultTheme, NavigationContainer } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { setAuthToken } from './src/api/client'
import { loginRequest, logoutLocal } from './src/api/auth'
import { LoginScreen } from './src/screens/LoginScreen'
import { clearToken, loadToken, saveToken } from './src/storage/tokenStorage'
import { clearRoles, loadRoles, saveRoles } from './src/storage/sessionStorage'
import { SessionContext, type SessionValue } from './src/context/SessionContext'
import { MainNavigator } from './src/navigation/MainNavigator'
import { colors } from './src/theme/colors'

const KEY_CORREO = 'erp_correo'

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.bgElevated,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
}

export default function App() {
  const [booting, setBooting] = useState(true)
  const [correo, setCorreo] = useState<string | null>(null)
  const [roles, setRoles] = useState<string[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const token = await loadToken()
        const guardado = await AsyncStorage.getItem(KEY_CORREO)
        const r = await loadRoles()
        if (token) {
          setAuthToken(token)
          setCorreo(guardado || 'Usuario')
          setRoles(r)
        }
      } finally {
        setBooting(false)
      }
    })()
  }, [])

  const handleSubmitLogin = useCallback(async (c: string, clave: string) => {
    const data = await loginRequest(c, clave)
    await saveToken(data.token)
    await AsyncStorage.setItem(KEY_CORREO, data.correo)
    await saveRoles(data.roles)
    setCorreo(data.correo)
    setRoles(data.roles)
  }, [])

  const handleLogout = useCallback(async () => {
    await clearToken()
    await AsyncStorage.removeItem(KEY_CORREO)
    await clearRoles()
    logoutLocal()
    setCorreo(null)
    setRoles([])
  }, [])

  const session = useMemo<SessionValue | null>(() => {
    if (!correo) return null
    return { correo, roles, logout: () => void handleLogout() }
  }, [correo, roles, handleLogout])

  if (booting) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
        <StatusBar style="dark" />
      </View>
    )
  }

  return (
    <NavigationContainer theme={navTheme}>
      {session ? (
        <SessionContext.Provider value={session}>
          <MainNavigator />
        </SessionContext.Provider>
      ) : (
        <LoginScreen onSubmit={handleSubmitLogin} />
      )}
      <StatusBar style="dark" />
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
})
