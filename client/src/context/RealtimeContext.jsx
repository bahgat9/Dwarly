import React, { createContext, useContext, useState, useCallback } from 'react'
import NotificationContainer from '../components/RealtimeNotification'

const RealtimeContext = createContext()

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

export function RealtimeProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      duration: 5000,
      type: 'info',
      ...notification
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const showSuccess = useCallback((message) => {
    addNotification({ message, type: 'success' })
  }, [addNotification])

  const showError = useCallback((message) => {
    addNotification({ message, type: 'error' })
  }, [addNotification])

  const showWarning = useCallback((message) => {
    addNotification({ message, type: 'warning' })
  }, [addNotification])

  const showInfo = useCallback((message) => {
    addNotification({ message, type: 'info' })
  }, [addNotification])

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </RealtimeContext.Provider>
  )
}
