import Constants from 'expo-constants'
import { Platform } from 'react-native'

const PORT = '8080'

/**
 * En Expo Go, `debuggerHost` suele ser "IP_DE_TU_PC:puertoMetro".
 * Esa misma IP es la que debe usar el celular para llegar al Spring en el puerto 8080.
 * (10.0.2.2 solo sirve en emulador, no en celular físico.)
 */
function inferDevMachineHost(): string | null {
  const dh =
    Constants.expoGoConfig?.debuggerHost ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost
  if (!dh || typeof dh !== 'string') return null
  const host = dh.split(':')[0]?.trim()
  if (!host || host === 'localhost' || host === '127.0.0.1') return null
  return host
}

export function getDefaultApiBaseUrl(): string {
  const inferred = inferDevMachineHost()
  if (inferred) {
    return `http://${inferred}:${PORT}/api`
  }
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${PORT}/api`
  }
  return `http://localhost:${PORT}/api`
}

function normalizeBase(url: string): string {
  return url.replace(/\/$/, '')
}

export const API_BASE_URL = normalizeBase(
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
    (__DEV__ ? getDefaultApiBaseUrl() : 'https://TU-DOMINIO.com/api'),
)
