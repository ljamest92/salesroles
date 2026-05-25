import { useEffect, useState } from 'react'
import { blink } from '../lib/blink'
import type { BlinkUser } from '@blinkdotnew/sdk'

export function useAuth() {
  const [user, setUser] = useState<BlinkUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (!state.isLoading) setIsLoading(false)
    })
    return unsubscribe
  }, [])

  const login = (redirectUrl?: string) => blink.auth.login(redirectUrl)
  const logout = () => blink.auth.logout()

  return { user, isLoading, login, logout, isAuthenticated: !!user }
}
