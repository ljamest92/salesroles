import React from 'react'
import ReactDOM from 'react-dom/client'

// Disable browser native scroll restoration so our manual scrollTo(0,0) on mount isn't overridden
if (typeof history !== 'undefined') history.scrollRestoration = 'manual'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { AuthProvider } from './hooks/useAuth'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BlinkUIProvider theme="midnight" darkMode="dark">
            <Toaster position="top-right" />
            <div className="flex w-full flex-1 flex-col min-h-0">
              <App />
            </div>
          </BlinkUIProvider>
        </QueryClientProvider>
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
