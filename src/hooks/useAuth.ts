import { useState } from 'react'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role?: 'candidate' | 'company'
}

const STORAGE_KEY = 'salesroles_user'
const TOKEN_KEY = 'salesroles_token'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) return null
      // base64url → base64 so atob works with jose-issued JWTs
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(base64))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      // Merge with stored user to recover displayName
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const storedUser = JSON.parse(stored)
          return { ...payload, displayName: storedUser.displayName || '' } as AuthUser
        } catch {}
      }
      return payload as AuthUser
    } catch {
      return null
    }
  })
  const [isLoading] = useState(false)

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
