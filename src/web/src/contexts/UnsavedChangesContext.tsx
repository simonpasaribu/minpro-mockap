// Global flag for unsaved changes - used by Navbar to check before navigation
export const setUnsavedChangesFlag = (value: boolean) => {
  localStorage.setItem('hasUnsavedChanges', value.toString())
}

export const getUnsavedChangesFlag = (): boolean => {
  return localStorage.getItem('hasUnsavedChanges') === 'true'
}

import { createContext, useContext, ReactNode } from 'react'

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean
  checkBeforeNavigation: (callback: () => void) => void
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | null>(null)

export function UnsavedChangesProvider({ children, hasUnsavedChanges, onConfirm }: { 
  children: ReactNode
  hasUnsavedChanges: boolean
  onConfirm: () => void 
}) {
  const checkBeforeNavigation = (callback: () => void) => {
    if (hasUnsavedChanges) {
      onConfirm()
    } else {
      callback()
    }
  }

  return (
    <UnsavedChangesContext.Provider value={{ hasUnsavedChanges, checkBeforeNavigation }}>
      {children}
    </UnsavedChangesContext.Provider>
  )
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext)
  if (!context) {
    return { hasUnsavedChanges: false, checkBeforeNavigation: (cb: () => void) => cb() }
  }
  return context
}
