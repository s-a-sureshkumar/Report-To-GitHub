'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { fetchAuthSession, signInWithRedirect, signOut as amplifySignOut } from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'

export interface User {
  sub: string
  email: string
  name?: string
  groups: string[]
}

export interface AuthContextType {
  auth: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshAuth: (forceRefresh?: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshAuth = useCallback(async (forceRefresh = false) => {
    try {
      const session = await fetchAuthSession({ forceRefresh })
      const payload = session.tokens?.idToken?.payload
      if (payload?.sub) {
        setAuth({
          sub: payload.sub,
          email: typeof payload.email === 'string' ? payload.email : '',
          name: typeof payload.name === 'string' ? payload.name : undefined,
          groups: Array.isArray(payload['cognito:groups'])
            ? (payload['cognito:groups'] as string[])
            : [],
        })
      } else {
        setAuth(null)
      }
    } catch {
      setAuth(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshAuth()
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
        case 'signInWithRedirect':
          void refreshAuth()
          break
        case 'signedOut':
          setAuth(null)
          break
        case 'signInWithRedirect_failure':
          setLoading(false)
          break
      }
    })
    return unsubscribe
  }, [refreshAuth])

  const signInWithGoogle = useCallback(async () => {
    await signInWithRedirect({ provider: 'Google' })
  }, [])

  const signOut = useCallback(async () => {
    await amplifySignOut()
    setAuth(null)
  }, [])

  return (
    <AuthContext.Provider value={{ auth, loading, signInWithGoogle, signOut, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
