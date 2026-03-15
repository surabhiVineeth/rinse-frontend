import { useState, useCallback } from 'react'

let nextId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ icon, title, subtitle, type = 'info' }) => {
    const id = ++nextId
    setToasts(prev => [...prev.slice(-2), { id, icon, title, subtitle, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4500)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, dismiss }
}
