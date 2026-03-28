import { useContext } from 'react'
import { ConfirmContext } from './confirmContextValue'

export function useConfirm() {
  const context = useContext(ConfirmContext)

  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }

  return context.showConfirm
}
