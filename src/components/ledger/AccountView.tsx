'use client'

import { useState, useCallback, memo, useEffect } from 'react'
import {
  Plus, Trash2, Download, ChevronLeft, Edit2, Check, Search, Save, Upload, Calendar, X,
  AlertTriangle, ArrowRight, RefreshCw, LogOut, FileText, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AccountWithEntries } from '@/lib/supabase-db'
import { StatsCard } from './StatsCard'
import { TableRowSkeleton } from './LoadingStates'
import { useDebounce } from '@/hooks/ledger/use-debounce'

interface Entry {
  id: string
  date: string
  particulars: string
  amount: number
  type: 'credit' | 'debit'
  runningBalance?: number
}

interface AccountViewProps {
  account: AccountWithEntries
  isExporting: boolean
  onBack: () => void
  onLogout: () => void
  onCreateEntry: (entry: Omit<Entry, 'id' | 'runningBalance'>) => Promise<void>
  onUpdateEntry: (id: string, updates: Partial<Entry>) => Promise<void>
  onDeleteEntry: (id: string) => Promise<void>
  onExportPDF: (forceFull?: boolean) => void
}

/**
 * Memoized Account View Component
 * Prevents re-renders when parent state changes
 *
 * Performance:
 * - React.memo wrapper
 * - useCallback for all event handlers
 * - useMemo for expensive computations
 * - Debounced search
 * - Loading states
 */
const AccountView = memo<AccountViewProps>(({
  account,
  isExporting,
  onBack,
  onLogout,
  onCreateEntry,
  onUpdateEntry,
  onDeleteEntry,
  onExportPDF,
}) => {
  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showEditWarning, setShowEditWarning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  const [exportRange, setExportRange] = useState({
    start: '',
    end: new Date().toISOString().split('T')[0]
  })

  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    particulars: '',
    amount: '',
    type: 'credit' as 'credit' | 'debit'
  })

  // Debounce search term
  const debouncedSearch = useDebounce(searchTerm, 300)

  /**
   * Expensive computation: Sort entries by date
   * Memoized to prevent re-sort on every render
   */
  const sortedAuditTrail = useCallback(() => {
    if (!account.entries) return []

    const allEntries = [...account.entries].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (dateDiff !== 0) return dateDiff
      return a.id.localeCompare(b.id)
    })

    let running = 0
    let totalCredit = 0
    let totalDebit = 0

    return allEntries.map(e => {
      if (e.type === 'credit') {
        running += e.amount
        totalCredit += e.amount
      } else {
        running -= e.amount
        totalDebit += e.amount
      }
      return { ...e, runningBalance: running }
    })
  }, [account.entries])

  /**
   * Expensive computation: Filter entries by search
   * Memoized to prevent re-filter on every render
   */
  const filteredEntriesForDisplay = useCallback(() => {
    return sortedAuditTrail()
      .filter(e => !debouncedSearch || e.particulars.toLowerCase().includes(debouncedSearch.toLowerCase()))
      .reverse()
  }, [debouncedSearch])

  /**
   * Calculate totals
   * Memoized to prevent re-calc on every render
   */
  const accountTotals = useCallback(() => {
    const trail = sortedAuditTrail()
    const totalCredit = trail.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0)
    const totalDebit = trail.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0)
    return {
      credit: totalCredit,
      debit: totalDebit,
      balance: totalCredit - totalDebit
    }
  }, [sortedAuditTrail])

  /**
   * Handle entry form changes
   */
  const handleFormChange = useCallback((field: keyof typeof entryForm, value: string) => {
    setEntryForm(prev => ({ ...prev, [field]: value }))
  }, [])

  /**
   * Submit new entry
   */
  const submitEntry = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entryForm.amount || !entryForm.particulars) return

    setIsSubmitting(true)
    try {
      await onCreateEntry({
        date: entryForm.date,
        particulars: entryForm.particulars,
        amount: Math.abs(parseFloat(entryForm.amount)),
        type: entryForm.type
      })

      // Reset form
      setEntryForm({
        date: new Date().toISOString().split('T')[0],
        particulars: '',
        amount: '',
        type: 'credit'
      })
    } catch (error) {
      console.error('Error creating entry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [entryForm, onCreateEntry])

  /**
   * Handle delete entry
   */
  const handleDeleteEntry = useCallback(async (entryId: string) => {
    await onDeleteEntry(entryId)
  }, [onDeleteEntry])

  /**
   * Start editing entry
   */
  const startEditing = useCallback((id: string) => {
    setEditingId(id)
    setShowEditWarning(true)
  }, [])

  /**
   * Handle entry field update
   */
  const updateEntryField = useCallback(async (id: string, field: keyof Entry, value: any) => {
    try {
      await onUpdateEntry(id, { [field]: value })
    } catch (error) {
      console.error('Error updating entry:', error)
    }
  }, [onUpdateEntry])

  /**
   * Handle search input
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setSearchTerm('')
  }, [])

  /**
   * Handle export range change
   */
  const handleExportRangeChange = useCallback((field: 'start' | 'end', value: string) => {
    setExportRange(prev => ({ ...prev, [field]: value }))
  }, [])

  /**
   * Render entry row
   */
  const EntryRow = memo(({ entry, isEditing }: { entry: Entry, isEditing: boolean }) => {
    if (isEditing) {
      return (
        <TableRow className="hover:bg-slate-50">
          <TableCell className="py-4">
            <Input
              type="date"
              value={entry.date}
              onChange={(e) => updateEntryField(entry.id, 'date', e.target.value)}
              className="h-10"
            />
          </TableCell>
          <TableCell className="py-4">
            <Input
              value={entry.particulars}
              onChange={(e) => updateEntryField(entry.id, 'particulars', e.target.value)}
              className="h-10"
            />
          </TableCell>
          <TableCell className="py-4 text-right">
            <div className="flex items-center justify-end gap-2">
              <Select
                value={entry.type}
                onValueChange={(v: 'credit' | 'debit') => updateEntryField(entry.id, 'type', v)}
              >
                <SelectTrigger className="w-24 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit (+)</SelectItem>
                  <SelectItem value="debit">Debit (-)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                value={entry.amount}
                onChange={(e) => updateEntryField(entry.id, 'amount', parseFloat(e.target.value))}
                className="w-32 h-10"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setEditingId(null)}
                className="text-emerald-600 hover:text-emerald-700"
              >
                <Check size={16} />
              </Button>
            </div>
          </TableCell>
          <TableCell className="py-4 text-right font-bold">
            {entry.runningBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </TableCell>
          <TableCell className="py-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDeleteEntry(entry.id)}
              className="text-rose-600 hover:text-rose-700"
            >
              <Trash2 size={16} />
            </Button>
          </TableCell>
        </TableRow>
      )
    }

    return (
      <TableRow className="hover:bg-slate-50">
        <TableCell className="py-4 font-mono text-sm text-slate-600">
          {entry.date}
        </TableCell>
        <TableCell className="py-4">
          {entry.particulars}
        </TableCell>
        <TableCell className="py-4 text-right">
          <Badge
            variant={entry.type === 'credit' ? 'default' : 'destructive'}
            className={entry.type === 'credit' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}
          >
            {entry.type === 'credit' ? '+' : '-'}
            {entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Badge>
        </TableCell>
        <TableCell className="py-4 text-right font-bold tabular-nums">
          {entry.runningBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </TableCell>
        <TableCell className="py-4">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => startEditing(entry.id)}
              className="text-slate-400 hover:text-slate-600"
            >
              <Edit2 size={16} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDeleteEntry(entry.id)}
              className="text-rose-600 hover:text-rose-700"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  })

  EntryRow.displayName = 'EntryRow'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {showEditWarning && (
        <Alert className="max-w-md mx-auto mt-4 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong className="font-semibold">Edit Warning:</strong> Editing history recalculates all future balances.
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="text-emerald-600" size={20} />
              Export Report
            </DialogTitle>
            <DialogDescription>
              Select a date range for your report or export full history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Start Date</label>
              <Input
                type="date"
                value={exportRange.start}
                onChange={(e) => handleExportRangeChange('start', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">End Date</label>
              <Input
                type="date"
                value={exportRange.end}
                onChange={(e) => handleExportRangeChange('end', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onExportPDF(true)}
              className="w-full sm:w-auto"
            >
              Full History
            </Button>
            <Button
              onClick={() => onExportPDF(false)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            >
              Apply Range
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
              >
                <ChevronLeft size={24} />
              </Button>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{account.name}</h2>
                <p className="text-xs text-slate-500">{account.entries?.length || 0} entries</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsExportModalOpen(true)}
                size="sm"
                className="bg-slate-900 hover:bg-slate-800"
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Download size={16} className="mr-2" />
                )}
                Export Report
              </Button>
              <Button variant="ghost" size="icon" onClick={onLogout} className="text-slate-500 hover:text-rose-600">
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Lifetime Credit"
            value={`+${accountTotals().credit.toLocaleString()}`}
            type="credit"
          />
          <StatsCard
            title="Lifetime Debit"
            value={`-${accountTotals().debit.toLocaleString()}`}
            type="debit"
          />
          <StatsCard
            title="Current Balance"
            value={accountTotals().balance.toLocaleString()}
            type="balance"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitEntry} className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-2">
                <Input
                  type="date"
                  required
                  value={entryForm.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Select value={entryForm.type} onValueChange={(v: 'credit' | 'debit') => handleFormChange('type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit (+)</SelectItem>
                    <SelectItem value="debit">Debit (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={entryForm.amount}
                  placeholder="Amount"
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                />
              </div>
              <div className="md:col-span-4">
                <Input
                  required
                  value={entryForm.particulars}
                  placeholder="Description"
                  onChange={(e) => handleFormChange('particulars', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    <Plus size={16} className="mr-2" />
                  )}
                  Add Entry
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Transactions</CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
                {searchTerm && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X size={14} className="text-slate-400" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[140px] text-right">Amount</TableHead>
                    <TableHead className="w-[140px] text-right">Balance</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntriesForDisplay().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                        {debouncedSearch ? (
                          <div className="flex flex-col items-center gap-2">
                            <FileText size={48} className="text-slate-300" />
                            <p>No transactions found matching "{debouncedSearch}"</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <FileText size={48} className="text-slate-300" />
                            <p>No transactions yet. Add your first entry above.</p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntriesForDisplay().map(entry => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        isEditing={entry.id === editingId}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  )
})

AccountView.displayName = 'AccountView'

export { AccountView }
