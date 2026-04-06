import { createContext, useContext } from 'react'

export type SessionValue = {
  correo: string
  roles: string[]
  logout: () => void
}

export const SessionContext = createContext<SessionValue | null>(null)

export function useSession(): SessionValue {
  const v = useContext(SessionContext)
  if (!v) {
    throw new Error('useSession fuera de SessionContext')
  }
  return v
}
