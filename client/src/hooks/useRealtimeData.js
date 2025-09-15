import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../api'

/**
 * Custom hook for real-time data updates
 * @param {string} endpoint - API endpoint to poll
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Polling interval in milliseconds (default: 5000)
 * @param {boolean} options.enabled - Whether polling is enabled (default: true)
 * @param {Function} options.onUpdate - Callback when data is updated
 * @param {Array} options.dependencies - Dependencies that should trigger a refresh
 * @returns {Object} - { data, loading, error, refresh, lastUpdated }
 */
export function useRealtimeData(endpoint, options = {}) {
  const {
    interval = 5000,
    enabled = true,
    onUpdate,
    dependencies = []
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  
  const intervalRef = useRef(null)
  const isMountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return

    try {
      setError(null)
      const result = await api(endpoint)
      
      if (isMountedRef.current) {
        setData(result)
        setLastUpdated(new Date())
        setLoading(false)
        
        if (onUpdate) {
          onUpdate(result)
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error(`Failed to fetch data from ${endpoint}:`, err)
        setError(err.message)
        setLoading(false)
      }
    }
  }, [endpoint, onUpdate])

  const refresh = useCallback(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  // Start polling
  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchData()

    // Set up polling
    intervalRef.current = setInterval(fetchData, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval, fetchData, ...dependencies])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated
  }
}

/**
 * Hook for real-time status updates (like application status)
 * @param {string} endpoint - API endpoint to poll
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, refresh, lastUpdated, hasChanges }
 */
export function useRealtimeStatus(endpoint, options = {}) {
  const [previousData, setPreviousData] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)

  const onUpdate = useCallback((newData) => {
    if (previousData) {
      // More sophisticated change detection
      const hasChanged = JSON.stringify(previousData) !== JSON.stringify(newData)
      if (hasChanged) {
        setHasChanges(true)
        // Reset hasChanges after 2 seconds
        setTimeout(() => setHasChanges(false), 2000)
      }
    }
    setPreviousData(newData)
  }, [previousData])

  const result = useRealtimeData(endpoint, {
    ...options,
    onUpdate
  })

  return {
    ...result,
    hasChanges
  }
}
