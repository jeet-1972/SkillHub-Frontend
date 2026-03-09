import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, setAccessToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await authApi.refresh()
      setAccessToken(data.accessToken)
      setUser(data.user)
    } catch {
      setAccessToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password })
    setAccessToken(data.accessToken)
    setUser(data.user)
    return data
  }

  const signup = async (payload) => {
    const { data } = await authApi.signup(payload)
    setAccessToken(data.accessToken)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
