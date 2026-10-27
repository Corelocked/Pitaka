import { useEffect } from 'react'

export function useDialogFocus(ref, open, onClose) {
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    const dialog = ref.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog?.focus()
    const viewport = window.visualViewport
    let resizeFrame
    const updateViewport = () => {
      const height = viewport?.height ?? window.innerHeight
      const bottom = Math.max(0, window.innerHeight - height - (viewport?.offsetTop ?? 0))
      dialog?.style.setProperty('--dialog-viewport-height', `${height}px`)
      dialog?.style.setProperty('--dialog-viewport-bottom', `${bottom}px`)
    }
    const onResize = () => {
      updateViewport()
      cancelAnimationFrame(resizeFrame)
      // Viewport-driven layout settles before the focused field is repositioned.
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = requestAnimationFrame(() => {
          const active = document.activeElement
          if (dialog?.contains(active) && active.matches('input, select, textarea')) {
            const field = active.getBoundingClientRect()
            const bounds = dialog.getBoundingClientRect()
            dialog.scrollTop += field.top - bounds.top - (bounds.height - field.height) / 2
          }
        })
      })
    }
    updateViewport()
    window.addEventListener('resize', onResize)
    viewport?.addEventListener('resize', onResize)
    viewport?.addEventListener('scroll', updateViewport)
    const onKeyDown = (event) => {
      // Only the topmost dialog handles the keyboard (confirmations can cover a sheet).
      const dialogs = [...document.querySelectorAll('[role="dialog"]')].filter(
        (node) => node.getClientRects().length && !node.inert
      )
      if (dialogs.at(-1) !== dialog) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose?.()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [
        ...dialog.querySelectorAll(
          'button, input, select, textarea, a[href], [tabindex="0"], summary'
        )
      ].filter((node) => !node.disabled && node.getClientRects().length)
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!first) {
        event.preventDefault()
        dialog.focus()
      } else if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === dialog)
      ) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
      viewport?.removeEventListener('resize', onResize)
      viewport?.removeEventListener('scroll', updateViewport)
      cancelAnimationFrame(resizeFrame)
      dialog?.style.removeProperty('--dialog-viewport-height')
      dialog?.style.removeProperty('--dialog-viewport-bottom')
      if (previous?.isConnected) previous.focus()
    }
  }, [ref, open, onClose])
}
