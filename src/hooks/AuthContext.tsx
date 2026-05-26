import React, { createContext, useContext, useState } from 'react'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role?: 'candidate' | 'company'
}

export const STORAGE_KEY = 'salesroles_user'
export const TOKEN_KEY = 'salesroles_token'

function readUserFromStorage(): AuthUser | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const storedUser = JSON.parse(stored)
        return { ...payload, displayName: storedUser.displayName || storedUser.name || payload.email } as AuthUser
      } catch {}
    }
    return payload as AuthUser
  } catch {
    return null
  }
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (redirectUrl?: string) => void
  loginWithCredentials: (email: string, password: string) => Promise<AuthUser>
  register: (name: string, email: string, password: string, role: 'candidate' | 'company') => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readUserFromStorage())

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

  return (
    <AuthContext.Provider
      value={{ user, isLoading: false, isAuthenticated: !!user, login, loginWithCredentials, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
