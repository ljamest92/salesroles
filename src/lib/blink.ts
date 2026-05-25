import { createClient } from '@blinkdotnew/sdk'

export function getProjectId(): string {
  const env = (import.meta as any).env
  const envId = env.VITE_BLINK_PROJECT_ID
  if (envId) return envId
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const match = hostname.match(/^([^.]+)\.sites\.blink\.new$/)
  return match ? match[1] : 'salesroles-job-board-95he1wgn'
}

export const blink = createClient({
  projectId: getProjectId(),
  publishableKey: (import.meta as any).env.VITE_BLINK_PUBLISHABLE_KEY,
  auth: { mode: 'managed' },
})
