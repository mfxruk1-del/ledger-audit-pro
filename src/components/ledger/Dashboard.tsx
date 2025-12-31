'use client'

import { memo } from 'react'
import { Plus, Trash2, Save, ShieldCheck, ArrowRight, Briefcase, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AccountWithEntries } from '@/lib/supabase-db'
import { StatsCard } from './StatsCard'
import { AccountCardSkeleton, StatsCardSkeleton } from './LoadingStates'

interface DashboardProps {
  accounts: AccountWithEntries[]
  isLoading: boolean
  isExporting: boolean
  onAddAccount: (name: string) => void
  onDeleteAccount: (id: string) => void
  onExportBackup: () => void
  onSelectAccount: (id: string) => void
}

/**
 * Memoized Dashboard Component
 * Only re-renders when props actually change
 *
 * Performance: Prevents re-renders from parent state updates
 * - React.memo wrapper
 * - All functions from parent (callbacks)
 */
const Dashboard = memo<DashboardProps>(({
  accounts,
  isLoading,
  isExporting,
  onAddAccount,
  onDeleteAccount,
  onExportBackup,
  onSelectAccount,
}) => {
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Calculate account summaries
  const accountSummaries = accounts.map(acc => {
    const credit = acc.entries?.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0) || 0
    const debit = acc.entries?.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0) || 0
    return { ...acc, credit, debit, balance: credit - debit }
  })

  // Handle add account
  const handleAddAccount = () => {
    if (!newAccountName.trim()) return
    onAddAccount(newAccountName.trim())
    setNewAccountName('')
    setIsAddingAccount(false)
  }

  // Handle delete account
  const handleDeleteAccount = (id: string) => {
    onDeleteAccount(id)
    setDeleteConfirm(null)
  }

  // Handle delete confirm
  const handleDeleteConfirm = (id: string) => {
    setDeleteConfirm(id)
  }

  // Handle keyboard on account name input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddAccount()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <header className="mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs uppercase tracking-widest mb-2">
                  <ShieldCheck size={14} />
                  Ledger Audit Pro
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Accounts</h1>
                <p className="text-slate-500 mt-2">Manage and track your financial ledgers</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                <Save size={16} className="mr-2" />
                Backup
              </Button>
            </div>
          </header>

          <StatsCardSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AccountCardSkeleton count={6} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs uppercase tracking-widest mb-2">
                <ShieldCheck size={14} />
                Ledger Audit Pro
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Accounts</h1>
              <p className="text-slate-500 mt-2">Manage and track your financial ledgers</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onExportBackup}
                disabled={isExporting || accounts.length === 0}
              >
                {isExporting ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                Backup
              </Button>
              <Button
                onClick={() => setIsAddingAccount(true)}
                size="default"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus size={20} className="mr-2" /> New Ledger
              </Button>
            </div>
          </div>

          {isAddingAccount && (
            <Card className="mt-6 border-emerald-200 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Input
                    autoFocus
                    placeholder="Enter ledger name..."
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button onClick={handleAddAccount} className="bg-emerald-600 hover:bg-emerald-700">
                    Create
                  </Button>
                  <Button variant="ghost" onClick={() => setIsAddingAccount(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </header>

        {accountSummaries.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200">
            <CardContent className="py-20">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="bg-slate-100 p-6 rounded-full text-slate-400 mb-4">
                  <Briefcase size={48} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No ledgers detected</h3>
                <p className="text-slate-500 max-w-sm">Create your first ledger to start tracking transactions and managing your accounts.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accountSummaries.map(acc => (
              <Card
                key={acc.id}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-slate-200 hover:border-emerald-300"
                onClick={() => onSelectAccount(acc.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 rounded-xl transition-colors">
                      <Briefcase size={20} />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteConfirm(acc.id)
                      }}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 mb-1">
                    {acc.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    {acc.entries?.length || 0} Records
                  </p>
                </CardContent>
                <CardFooter className="pt-4 border-t">
                  <div className="w-full flex justify-between items-center">
                    <div>
                      <span className="text-xs font-medium text-slate-400 block mb-1 uppercase">Balance</span>
                      <span className={`text-lg font-bold tabular-nums ${acc.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                        {acc.balance?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </span>
                    </div>
                    <ArrowRight size={16} className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <Trash2 size={20} /> Delete Ledger
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>"{accounts.find(a => a.id === deleteConfirm)?.name}"</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDeleteAccount(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})

Dashboard.displayName = 'Dashboard'

export { Dashboard }
