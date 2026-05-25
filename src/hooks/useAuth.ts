import { useEffect, useState } from 'react'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role?: 'candidate' | 'company'
}

const STORAGE_KEY = 'salesroles_user'
const TOKEN_KEY = 'salesroles_token'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setUser(JSON.parse(stored))
    } catch {}
    setIsLoading(false)
  }, [])

  const login = (_redirectUrl?: string) => {
    window.location.href = '/register'
  }

  const loginWithCredentials = async (email: string, password: string): Promise<AuthUser> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'candidate' | 'company'
  ): Promise<AuthUser> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    window.location.href = '/'
  }

  return { user, isLoading, login, loginWithCredentials, register, logout, isAuthenticated: !!user }
}
