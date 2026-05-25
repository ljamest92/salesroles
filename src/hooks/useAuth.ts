import { useEffect, useState } from 'react'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role?: 'candidate' | 'company'
}

const STORAGE_KEY = 'salesroles_user'

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

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    window.location.href = '/'
  }

  return { user, isLoading, login, logout, isAuthenticated: !!user }
}
