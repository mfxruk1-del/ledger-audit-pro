import { useState, useCallback } from 'react'

export interface OptimisticAction<T> {
  id: string
  type: 'create' | 'update' | 'delete'
  data?: Partial<T>
}

/**
 * Custom hook for optimistic updates
 * Provides instant UI feedback while waiting for server response
 *
 * @param items - Current list of items
 * @param onSync - Function to call to sync with server after update
 * @returns Object with update methods
 *
 * @example
 * const { updateOptimistically, deleteOptimistically } = useOptimisticUpdates(
 *   entries,
 *   () => loadEntries() // Sync with server
 * )
 *
 * // Instant UI update
 * await createEntry(newEntry)
 *
 * // Optimistic version (instant):
 * updateOptimistically((items) => [
 *   ...items,
 *   { ...newEntry, id: 'temp-' + Date.now() }
 * ])
 */
export function useOptimisticUpdates<T extends { id: string }>(
  items: T[],
  onSync: () => void | Promise<void>
) {
  const [optimisticItems, setOptimisticItems] = useState<T[]>(items)
  const [pendingAction, setPendingAction] = useState<OptimisticAction<T> | null>(null)

  // Sync optimistic items with actual items when no pending action
  if (!pendingAction && optimisticItems !== items) {
    setOptimisticItems(items)
  }

  /**
   * Optimistically create item
   * Adds item to list immediately, then syncs
   */
  const createOptimistically = useCallback(
    (item: Omit<T, 'id'>) => {
      const tempId = 'temp-' + Date.now()
      const newItem = { ...item, id: tempId } as T

      setOptimisticItems((prev) => [...prev, newItem])
      setPendingAction({ id: tempId, type: 'create', data: item })

      return tempId
    },
    []
  )

  /**
   * Optimistically update item
   * Updates item in list immediately, then syncs
   */
  const updateOptimistically = useCallback(
    (id: string, updates: Partial<T>) => {
      setOptimisticItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        )
      )
      setPendingAction({ id, type: 'update', data: updates })

      return id
    },
    []
  )

  /**
   * Optimistically delete item
   * Removes item from list immediately, then syncs
   */
  const deleteOptimistically = useCallback((id: string) => {
    setOptimisticItems((prev) => prev.filter((item) => item.id !== id))
    setPendingAction({ id, type: 'delete' })
  }, [])

  /**
   * Confirm optimistic update completed
   * Call this after server operation succeeds
   */
  const confirmUpdate = useCallback(async () => {
    setPendingAction(null)
    await onSync()
  }, [onSync])

  /**
   * Rollback optimistic update
   * Call this if server operation fails
   */
  const rollbackUpdate = useCallback(() => {
    setPendingAction(null)
    setOptimisticItems(items)
  }, [items])

  return {
    // Optimistic items (with instant updates)
    items: optimisticItems,
    pendingAction,

    // Update methods
    createOptimistically,
    updateOptimistically,
    deleteOptimistically,

    // Sync methods
    confirmUpdate,
    rollbackUpdate,

    // Reset to actual items
    reset: () => setOptimisticItems(items),
  }
}
