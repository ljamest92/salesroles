import React from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'

export function DashboardLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: '#0d0d0d' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-full flex-1"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
