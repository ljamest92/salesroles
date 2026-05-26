import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

const TOKEN_KEY = 'salesroles_token'
const STORAGE_KEY = 'salesroles_user'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const userRaw = params.get('user')

    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw)
        localStorage.setItem(TOKEN_KEY, token)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
        navigate({ to: '/dashboard', search: { mode: user.role === 'company' ? 'company' : 'candidate' } as any })
      } catch {
        navigate({ to: '/login' as any })
      }
    } else {
      navigate({ to: '/login' as any })
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground font-medium animate-pulse">Signing you in...</p>
    </div>
  )
}
