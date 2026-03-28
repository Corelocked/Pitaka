import { useState, useCallback, useRef } from 'react'
import Modal from '../components/Modal'
import { ConfirmContext } from './confirmContextValue'

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, title: '', description: '', confirmText: 'Confirm', cancelText: 'Cancel' })
  const resolverRef = useRef(null)

  const showConfirm = useCallback(({ title = 'Confirm', description = '', confirmText = 'Confirm', cancelText = 'Cancel' } = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setState({ open: true, title, description, confirmText, cancelText })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    try {
      if (resolverRef.current) resolverRef.current(true)
    } finally {
      resolverRef.current = null
      setState(s => ({ ...s, open: false }))
    }
  }, [])

  const handleCancel = useCallback(() => {
    try {
      if (resolverRef.current) resolverRef.current(false)
    } finally {
      resolverRef.current = null
      setState(s => ({ ...s, open: false }))
    }
  }, [])

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
