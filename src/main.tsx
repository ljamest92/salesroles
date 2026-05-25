import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import { BlinkProvider, BlinkAuthProvider } from '@blinkdotnew/react'
import { getProjectId } from './lib/blink'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BlinkProvider projectId={getProjectId()}>
          <BlinkAuthProvider>
            <BlinkUIProvider theme="midnight" darkMode="system">
              <Toaster />
              <div className="flex w-full flex-1 flex-col min-h-0">
                <App />
              </div>
            </BlinkUIProvider>
          </BlinkAuthProvider>
        </BlinkProvider>
      </QueryClientProvider>
  </React.StrictMode>,
)