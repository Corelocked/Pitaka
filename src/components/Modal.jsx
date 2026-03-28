import React from 'react'
import './Modal.css'

export default function Modal({ open, title, description, children, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        <h3 id="modal-title">{title}</h3>
        <div className="modal-body">{children ?? description}</div>
        {/* Only show default actions when explicit onConfirm/onCancel are provided and no children form handles actions itself */}
        {(!children || (children && typeof onConfirm === 'function')) && (
          <div className="modal-actions">
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (typeof onCancel === 'function') onCancel()
              }}
            >{cancelText}</button>
            <button
              className="btn danger"
              type="button"
              onClick={() => {
                if (typeof onConfirm === 'function') onConfirm()
              }}
            >{confirmText}</button>
          </div>
        )}
      </div>
    </div>
  )
}
