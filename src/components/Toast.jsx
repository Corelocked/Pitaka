import React, { useEffect } from 'react'
import './Toast.css'

export default function Toast({ open, message, actionText, onAction, onClose, duration = 6000 }) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => { onClose && onClose() }, duration)
    return () => clearTimeout(t)
  }, [open, duration, onClose])

  if (!open) return null
  return (
    <div className="toast" role="status" aria-live="polite">
      <div className="toast-body">{message}</div>
      {actionText && <button className="toast-action" onClick={onAction}>{actionText}</button>}
      <button className="toast-close" aria-label="Close" onClick={onClose}>✕</button>
    </div>
  )
}