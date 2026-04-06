import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY_ROLES = 'erp_roles_json'

export async function saveRoles(roles: string[]) {
  await AsyncStorage.setItem(KEY_ROLES, JSON.stringify(roles))
}

export async function loadRoles(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY_ROLES)
  if (!raw) return []
  try {
    const p = JSON.parse(raw) as unknown
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export async function clearRoles() {
  await AsyncStorage.removeItem(KEY_ROLES)
}
