'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * Custom hook for adaptive polling that adjusts frequency based on activity
 *
 * @param {Function} fetchFunction - The function to call on each poll
 * @param {Object} options - Configuration options
 * @returns {Object} - Control functions and state
 */
export function useAdaptivePolling(fetchFunction, options = {}) {
  const {
    minInterval = 1000,      // Minimum polling interval (active)
    maxInterval = 10000,     // Maximum polling interval (very idle)
    idleThreshold = 60000,   // Time before considered idle (1 minute)
    veryIdleThreshold = 300000, // Time before considered very idle (5 minutes)
  } = options

  const [isPolling, setIsPolling] = useState(true)
  const [currentInterval, setCurrentInterval] = useState(minInterval)

  const intervalRef = useRef()
  const lastActivityRef = useRef(Date.now())
  const lastFetchRef = useRef(0)

  // Calculate appropriate interval based on activity
  const calculateInterval = useCallback(() => {
    const now = Date.now()
    const timeSinceActivity = now - lastActivityRef.current

    if (timeSinceActivity < 5000) {
      // Very recent activity (< 5 seconds)
      return minInterval
    } else if (timeSinceActivity < idleThreshold) {
      // Recent activity (< 1 minute)
      return Math.min(minInterval * 2, 2000)
    } else if (timeSinceActivity < veryIdleThreshold) {
      // Idle (1-5 minutes)
      return Math.min(minInterval * 5, 5000)
    } else {
      // Very idle (> 5 minutes)
      return maxInterval
    }
  }, [minInterval, maxInterval, idleThreshold, veryIdleThreshold])

  // Record user activity
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now()

    // Immediately speed up polling if we were idle
    const newInterval = calculateInterval()
    if (newInterval < currentInterval) {
      setCurrentInterval(newInterval)
      // Force immediate fetch if we haven't fetched recently
      if (Date.now() - lastFetchRef.current > newInterval) {
        fetchFunction()
        lastFetchRef.current = Date.now()
      }
    }
  }, [calculateInterval, currentInterval, fetchFunction])

  // Main polling loop
  useEffect(() => {
    if (!isPolling) return

    const poll = async () => {
      // Adjust interval based on activity
      const newInterval = calculateInterval()
      if (newInterval !== currentInterval) {
        setCurrentInterval(newInterval)
      }

      // Perform fetch
      await fetchFunction()
      lastFetchRef.current = Date.now()

      // Schedule next poll
      intervalRef.current = setTimeout(poll, newInterval)
    }

    // Start polling
    poll()

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
      }
    }
  }, [isPolling, calculateInterval, fetchFunction, currentInterval])

  // Pause/resume functions
  const pause = useCallback(() => {
    setIsPolling(false)
    if (intervalRef.current) {
      clearTimeout(intervalRef.current)
    }
  }, [])

  const resume = useCallback(() => {
    setIsPolling(true)
    recordActivity()
  }, [recordActivity])

  // Force immediate fetch
  const forceRefresh = useCallback(() => {
    recordActivity()
    fetchFunction()
    lastFetchRef.current = Date.now()
  }, [recordActivity, fetchFunction])

  return {
    recordActivity,
    pause,
    resume,
    forceRefresh,
    currentInterval,
    isPolling
  }
}