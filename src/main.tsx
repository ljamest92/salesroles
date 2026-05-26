import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import App from './App'
import { AuthProvider } from './hooks/useAuth'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BlinkUIProvider theme="midnight" darkMode="system">
          <Toaster position="top-right" />
          <div className="flex w-full flex-1 flex-col min-h-0">
            <App />
          </div>
        </BlinkUIProvider>
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>,
)
