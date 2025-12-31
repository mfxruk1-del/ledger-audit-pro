/**
 * Loading Skeleton Components
 * Provide structure during async operations
 * Improves perceived performance
 */

interface CardSkeletonProps {
  count?: number
}

/**
 * Account Card Skeleton
 * Shows placeholder while loading accounts
 */
export function AccountCardSkeleton({ count = 6 }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-slate-50 rounded-xl animate-pulse" />
            <div className="w-8 h-8 bg-slate-50 rounded-lg opacity-0" />
          </div>
          <div className="h-6 w-40 bg-slate-50 rounded-lg animate-pulse mb-1" />
          <div className="h-4 w-20 bg-slate-50 rounded-md animate-pulse" />
          <div className="pt-4 border-t border-slate-100 mt-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-3 w-12 bg-slate-100 rounded animate-pulse mb-1" />
                <div className="h-5 w-24 bg-slate-100 rounded-md animate-pulse" />
              </div>
              <div className="w-4 h-4 bg-slate-100 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

/**
 * Stats Card Skeleton
 * Shows placeholder while loading stats
 */
export function StatsCardSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-slate-200 rounded-lg p-6 animate-pulse"
        >
          <div className="h-4 w-32 bg-slate-100 rounded mb-2" />
          <div className="h-8 w-40 bg-slate-100 rounded-md" />
          <div className="h-4 w-24 bg-slate-50 rounded mt-2" />
        </div>
      ))}
    </>
  )
}

/**
 * Table Row Skeleton
 * Shows placeholder while loading entries
 */
export function TableRowSkeleton({ count = 5 }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 py-4 border-b border-slate-100">
          <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
          <div className="flex-1 h-4 bg-slate-50 rounded animate-pulse" />
          <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
          <div className="w-28 h-4 bg-slate-50 rounded-md animate-pulse" />
        </div>
      ))}
    </>
  )
}
