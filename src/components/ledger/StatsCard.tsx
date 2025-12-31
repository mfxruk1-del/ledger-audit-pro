import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  type?: 'default' | 'credit' | 'debit' | 'balance'
}

/**
 * Memoized StatsCard Component
 * Prevents unnecessary re-renders when parent updates
 *
 * Performance: Only re-renders when props actually change
 * - title
 * - value
 * - subtitle
 * - type
 *
 * Used in dashboard for credit/debit/balance displays
 */
const StatsCard = memo(({ title, value, subtitle, type = 'default' }: StatsCardProps) => {
  const colorClasses = {
    default: 'bg-white border-slate-200',
    credit: 'bg-emerald-50 border-emerald-200',
    debit: 'bg-rose-50 border-rose-200',
    balance: 'bg-emerald-600 border-emerald-700 text-white'
  }

  const textClasses = {
    default: 'text-slate-900',
    credit: 'text-emerald-700',
    debit: 'text-rose-700',
    balance: 'text-white'
  }

  return (
    <Card className={`${colorClasses[type]} border`}>
      <CardHeader className="pb-2">
        <CardDescription className={type === 'balance' ? 'text-emerald-100' : 'text-slate-500'}>
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${textClasses[type]}`}>{value}</div>
        {subtitle && (
          <div className={`text-sm mt-1 ${type === 'balance' ? 'text-emerald-100' : 'text-slate-400'}`}>
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

StatsCard.displayName = 'StatsCard'

export { StatsCard }
