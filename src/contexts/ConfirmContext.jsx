import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import Modal from '../components/Modal'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ open: false, title: '', description: '', confirmText: 'Confirm', cancelText: 'Cancel' })
  const resolverRef = useRef(null)

  const showConfirm = useCallback(({ title = 'Confirm', description = '', confirmText = 'Confirm', cancelText = 'Cancel' } = {}) => {
    console.log('ConfirmProvider: showConfirm', { title })
    try { window.__APP_LOGS = window.__APP_LOGS || []; window.__APP_LOGS.unshift({ ts: Date.now(), msg: 'ConfirmProvider: showConfirm ' + title }) } catch (e) {}
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setState({ open: true, title, description, confirmText, cancelText })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    console.log('ConfirmProvider: handleConfirm - resolving true')
    try { window.__APP_LOGS = window.__APP_LOGS || []; window.__APP_LOGS.unshift({ ts: Date.now(), msg: 'ConfirmProvider: handleConfirm' }) } catch (e) {}
    try {
      if (resolverRef.current) resolverRef.current(true)
    } catch (err) {
      console.error('ConfirmProvider: error resolving confirm promise', err)
    } finally {
      resolverRef.current = null
      setState(s => ({ ...s, open: false }))
    }
  }, [])

  const handleCancel = useCallback(() => {
    console.log('ConfirmProvider: handleCancel - resolving false')
    try { window.__APP_LOGS = window.__APP_LOGS || []; window.__APP_LOGS.unshift({ ts: Date.now(), msg: 'ConfirmProvider: handleCancel' }) } catch (e) {}
    try {
      if (resolverRef.current) resolverRef.current(false)
    } catch (err) {
      console.error('ConfirmProvider: error resolving cancel promise', err)
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
