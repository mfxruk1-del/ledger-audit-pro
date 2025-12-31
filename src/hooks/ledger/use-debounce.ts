import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook for debouncing values
 * Prevents expensive operations on every keystroke
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearch = useDebounce(searchTerm, 300)
 *
 * // Only filters when debouncedSearch changes, not searchTerm
 * const filtered = data.filter(item =>
 *   item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
 * )
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cancel timeout if value changes before delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for debouncing function calls
 * Prevents expensive function calls on every event
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced function
 *
 * @example
 * const debouncedSearch = useDebouncedCallback((query: string) => {
 *   performExpensiveSearch(query)
 * }, [performExpensiveSearch], 500)
 *
 * // Only calls performExpensiveSearch after 500ms of no calls
 * onChange={(e) => debouncedSearch(e.target.value)}
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = (...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}
