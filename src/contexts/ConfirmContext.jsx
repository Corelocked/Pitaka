import React, { createContext, useContext, useState, useCallback } from 'react'
import Modal from '../components/Modal'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, title: '', description: '', confirmText: 'Confirm', cancelText: 'Cancel', resolver: null })

  const showConfirm = useCallback(({ title = 'Confirm', description = '', confirmText = 'Confirm', cancelText = 'Cancel' } = {}) => {
    return new Promise((resolve) => {
      setState({ open: true, title, description, confirmText, cancelText, resolver: resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (state.resolver) state.resolver(true)
    setState(s => ({ ...s, open: false, resolver: null }))
  }, [state.resolver])

  const handleCancel = useCallback(() => {
    if (state.resolver) state.resolver(false)
    setState(s => ({ ...s, open: false, resolver: null }))
  }, [state.resolver])

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <Modal
        open={state.open}
        title={state.title}
        description={state.description}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    // fallback: synchronous browser confirm as a safe default
    return async ({ title = 'Confirm', description = '' } = {}) => {
      return window.confirm(description || title)
    }
  }
  return ctx.showConfirm
}

export default ConfirmContext
