import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'erp_token'

export async function saveToken(token: string) {
  await AsyncStorage.setItem(KEY, token)
}

export async function loadToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEY)
}

export async function clearToken() {
  await AsyncStorage.removeItem(KEY)
}
