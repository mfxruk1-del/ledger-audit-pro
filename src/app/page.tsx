'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  Plus, 
  Trash2, 
  Download, 
  ChevronLeft,
  Edit2,
  Check,
  Search,
  Briefcase,
  Save,
  Upload,
  Calendar,
  X,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  FileText,
  RefreshCw,
  LogOut,
  User,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
import { supabase } from '@/lib/supabase'
import { getAccounts, createAccount, deleteAccount, createEntry, updateEntry, deleteEntry, subscribeToAccounts, subscribeToEntries, AccountWithEntries } from '@/lib/supabase-db'
import AuthForm from '@/components/auth/auth-form'
import { 
  registerServiceWorker, 
  onOnlineChange, 
  isOnline as checkOnline
} from '@/lib/pwa-utils'

// ===== PHASE 2 RULES: Service Worker Registration =====
// RULE: Register service worker once on app load
// RULE: Confirm it activates correctly in DevTools
useEffect(() => {
  registerServiceWorker()
}, [])

interface Entry {
  id: string
  date: string
  particulars: string
  amount: number
  type: 'credit' | 'debit'
  runningBalance?: number
}

export default function LedgerAuditPro() {
  // Auth state
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  
  // App state
  const [view, setView] = useState<'dashboard' | 'account'>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [accounts, setAccounts] = useState<AccountWithEntries[]>([])
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [showEditWarning, setShowEditWarning] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  
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

  // Initialize and check auth
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      if (session) {
        await loadAccounts()
      }
      setLoading(false)
    }

    init()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        loadAccounts()
      } else {
        setAccounts([])
        setActiveAccountId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadAccounts = async () => {
    try {
      const data = await getAccounts()
      setAccounts(data)
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  // Real-time subscriptions
  useEffect(() => {
    if (!session) return

    const accountsSubscription = subscribeToAccounts(() => {
      loadAccounts()
    })

    return () => {
      accountsSubscription.unsubscribe()
    }
  }, [session])

  useEffect(() => {
    if (!session || !activeAccountId) return

    const entriesSubscription = subscribeToEntries(activeAccountId, () => {
      loadAccounts()
    })

    return () => {
      entriesSubscription.unsubscribe()
    }
  }, [session, activeAccountId])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setAccounts([])
    setActiveAccountId(null)
    setView('dashboard')
  }

  const activeAccount = useMemo(() => 
    accounts.find(acc => acc.id === activeAccountId), 
    [accounts, activeAccountId]
  )

  const accountSummaries = useMemo(() => {
    return accounts.map(acc => {
      const credit = acc.entries?.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0) || 0
      const debit = acc.entries?.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0) || 0
      return { ...acc, credit, debit, balance: credit - debit }
    })
  }, [accounts])

  const { sortedAuditTrail, accountTotals } = useMemo(() => {
    if (!activeAccount || !activeAccount.entries) return { 
      sortedAuditTrail: [], 
      accountTotals: { credit: 0, debit: 0, balance: 0 }
    }
    
    const allEntries = [...activeAccount.entries].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (dateDiff !== 0) return dateDiff
      return a.id.localeCompare(b.id)
    })

    let running = 0
    let totalCredit = 0
    let totalDebit = 0
    
    const trail = allEntries.map(e => {
      if (e.type === 'credit') {
        running += e.amount
        totalCredit += e.amount
      } else {
        running -= e.amount
        totalDebit += e.amount
      }
      return { ...e, runningBalance: running }
    })

    return { 
      sortedAuditTrail: trail, 
      accountTotals: { credit: totalCredit, debit: totalDebit, balance: totalCredit - totalDebit }
    }
  }, [activeAccount])

  const filteredEntriesForDisplay = useMemo(() => {
    return sortedAuditTrail
      .filter(e => !searchTerm || e.particulars.toLowerCase().includes(searchTerm.toLowerCase()))
      .reverse()
  }, [sortedAuditTrail, searchTerm])

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) return
    
    try {
      await createAccount(newAccountName.trim())
      setNewAccountName('')
      setIsAddingAccount(false)
      await loadAccounts()
    } catch (error) {
      console.error('Error creating account:', error)
    }
  }

  const handleDeleteAccount = async (id: string) => {
    try {
      await deleteAccount(id)
      setDeleteConfirm(null)
      await loadAccounts()
      if (activeAccountId === id) {
        setActiveAccountId(null)
        setView('dashboard')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  const submitEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entryForm.amount || !entryForm.particulars || !activeAccount) return
    
    try {
      await createEntry({
        account_id: activeAccount.id,
        date: entryForm.date,
        particulars: entryForm.particulars,
        amount: Math.abs(parseFloat(entryForm.amount)),
        type: entryForm.type
      })
      
      setEntryForm({ ...entryForm, particulars: '', amount: '' })
      await loadAccounts()
    } catch (error) {
      console.error('Error creating entry:', error)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteEntry(entryId)
      await loadAccounts()
    } catch (error) {
      console.error('Error deleting entry:', error)
    }
  }

  const startEditing = (id: string) => {
    setEditingId(id)
    setShowEditWarning(true)
  }

  const updateEntryField = async (id: string, field: keyof Entry, value: any) => {
    try {
      const entry = activeAccount?.entries.find(e => e.id === id)
      if (!entry) return

      await updateEntry(id, { [field]: value })
      await loadAccounts()
    } catch (error) {
      console.error('Error updating entry:', error)
    }
  }

  const exportBackup = () => {
    setIsExporting(true)
    setTimeout(() => {
      const dataStr = JSON.stringify(accounts, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', `audit_backup_${Date.now()}.json`)
      linkElement.click()
      setIsExporting(false)
    }, 300)
  }

  const handleExportPDF = (forceFull = false) => {
    const start = !forceFull && exportRange.start ? new Date(exportRange.start) : null
    const end = !forceFull && exportRange.end ? new Date(exportRange.end) : null

    let balanceBroughtForward = 0
    const inRangeEntries: Entry[] = []

    sortedAuditTrail.forEach(e => {
      const eDate = new Date(e.date)
      if (start && eDate < start) {
        balanceBroughtForward = e.runningBalance!
      } else if ((!start || eDate >= start) && (!end || eDate <= end)) {
        inRangeEntries.push(e)
      }
    })

    const printWindow = window.open('', '_blank')
    if (!printWindow || !activeAccount) return
    
    const rowsHtml = inRangeEntries.map((e, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${e.date}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0;">${e.particulars}</td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; text-align: right; color: ${e.type === 'credit' ? '#059669' : '#e11d48'}; font-weight: 600;">
          ${e.type === 'credit' ? '+' : '-'}${e.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
        </td>
        <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">
          ${e.runningBalance?.toLocaleString(undefined, {minimumFractionDigits: 2})}
        </td>
      </tr>
    `).join('')

    const rangeCredit = inRangeEntries.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0)
    const rangeDebit = inRangeEntries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0)
    const closingBalance = inRangeEntries.length > 0 ? inRangeEntries[inRangeEntries.length - 1].runningBalance : balanceBroughtForward

    printWindow.document.write(`
      <html>
        <head>
          <title>Audit Report - ${activeAccount.name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 12px; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .stat { background: #f1f5f9; padding: 20px; border-radius: 12px; }
            .stat.primary { background: #059669; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 28px; color: #0f172a;">${activeAccount.name}</h1>
            <p style="margin: 8px 0 0 0; color: #64748b;">Statement Period: ${forceFull ? 'All Time' : `${exportRange.start} to ${exportRange.end}`}</p>
          </div>
          <div class="summary">
            <div class="stat"><strong style="display: block; margin-bottom: 8px; font-size: 12px; text-transform: uppercase;">Brought Forward</strong><span style="font-size: 24px; font-weight: 700;">${balanceBroughtForward.toLocaleString()}</span></div>
            <div class="stat"><strong style="display: block; margin-bottom: 8px; font-size: 12px; text-transform: uppercase;">Total Credit</strong><span style="font-size: 24px; font-weight: 700; color: #059669;">+${rangeCredit.toLocaleString()}</span></div>
            <div class="stat"><strong style="display: block; margin-bottom: 8px; font-size: 12px; text-transform: uppercase;">Total Debit</strong><span style="font-size: 24px; font-weight: 700; color: #e11d48;">-${rangeDebit.toLocaleString()}</span></div>
            <div class="stat primary"><strong style="display: block; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; opacity: 0.9;">Closing Balance</strong><span style="font-size: 24px; font-weight: 700;">${closingBalance.toLocaleString()}</span></div>
          </div>
          <table>
            <thead><tr><th>Date</th><th>Particulars</th><th style="text-align:right">Amount</th><th style="text-align:right">Balance</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => { 
      printWindow.print() 
      setIsExportModalOpen(false)
    }, 500)
  }

  const StatsCard = ({ title, value, subtitle, type = 'default' }: { 
    title: string
    value: string
    subtitle?: string
    type?: 'default' | 'credit' | 'debit' | 'balance'
  }) => {
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
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth form if not logged in
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex items-center justify-center p-4 safe-bottom safe-top">
        <AuthForm onAuthSuccess={() => setSession(supabase.auth.getSession().then(s => s.data.session))} />
      </div>
    )
  }

  if (view === 'dashboard') {
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
                  onClick={exportBackup}
                  disabled={isExporting || accounts.length === 0}
                >
                  {isExporting ? (
                    <RefreshCw size={16} className="mr-2 animate-spin" />
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
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-500 hover:text-rose-600">
                  <LogOut size={20} />
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
                      onChange={e => setNewAccountName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddAccount()}
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
                  onClick={() => { setActiveAccountId(acc.id); setView('account'); }}
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
                          e.stopPropagation(); 
                          setDeleteConfirm(acc.id); 
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
                <AlertTriangle size={20} /> Delete Ledger
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

        <footer className="mt-auto border-t border-slate-200 bg-white safe-bottom">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-500">
                Ledger Audit Pro v2.0 • Professional Financial Tracking
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>{accountSummaries.length} Ledgers</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{accountSummaries.reduce((sum, a) => sum + (a.entries?.length || 0), 0)} Total Entries</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    )
  }

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
                onChange={e => setExportRange({...exportRange, start: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">End Date</label>
              <Input 
                type="date" 
                value={exportRange.end} 
                onChange={e => setExportRange({...exportRange, end: e.target.value})} 
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleExportPDF(true)}
              className="w-full sm:w-auto"
            >
              Full History
            </Button>
            <Button 
              onClick={() => handleExportPDF(false)}
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
                onClick={() => { 
                  setView('dashboard'); 
                  setSearchTerm(''); 
                  setEditingId(null); 
                }}
              >
                <ChevronLeft size={24} />
              </Button>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{activeAccount?.name}</h2>
                <p className="text-xs text-slate-500">{activeAccount?.entries?.length || 0} entries</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setIsExportModalOpen(true)}
                size="sm"
                className="bg-slate-900 hover:bg-slate-800"
              >
                <Download size={16} className="mr-2" />
                Export Report
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-500 hover:text-rose-600">
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
            value={`+${accountTotals.credit.toLocaleString()}`}
            type="credit"
          />
          <StatsCard 
            title="Lifetime Debit" 
            value={`-${accountTotals.debit.toLocaleString()}`}
            type="debit"
          />
          <StatsCard 
            title="Current Balance" 
            value={accountTotals.balance.toLocaleString()}
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
                  onChange={e => setEntryForm({...entryForm, date: e.target.value})} 
                />
              </div>
              <div className="md:col-span-2">
                <Select value={entryForm.type} onValueChange={(v: 'credit' | 'debit') => setEntryForm({...entryForm, type: v})}>
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
                  onChange={e => setEntryForm({...entryForm, amount: e.target.value})} 
                />
              </div>
              <div className="md:col-span-4">
                <Input 
                  type="text" 
                  required 
                  value={entryForm.particulars} 
                  placeholder="Description / Particulars" 
                  onChange={e => setEntryForm({...entryForm, particulars: e.target.value})} 
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Save Entry
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder="Search entries..." 
                  className="pl-9 w-full sm:w-64"
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[600px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right w-[140px]">Transaction</TableHead>
                    <TableHead className="text-right w-[140px]">Balance</TableHead>
                    <TableHead className="w-[100px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntriesForDisplay.map((e) => {
                    const isEditing = editingId === e.id
                    return (
                      <TableRow key={e.id} className="group hover:bg-slate-50/50">
                        <TableCell>
                          {isEditing ? (
                            <Input 
                              type="date" 
                              value={e.date} 
                              className="bg-white"
                              onChange={v => updateEntryField(e.id, 'date', v.target.value)} 
                            />
                          ) : (
                            <span className="text-sm font-medium text-slate-500">{e.date}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input 
                              type="text" 
                              value={e.particulars} 
                              className="bg-white w-full"
                              onChange={v => updateEntryField(e.id, 'particulars', v.target.value)} 
                            />
                          ) : (
                            <span className="text-sm font-semibold">{e.particulars}</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${e.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {e.type === 'credit' ? '+' : '-'}{e.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {e.runningBalance?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => isEditing ? setEditingId(null) : startEditing(e.id)}
                            >
                              {isEditing ? <Check size={16} /> : <Edit2 size={14} />}
                            </Button>
                            <Dialog open={deleteConfirm === e.id} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-all"
                                  onClick={() => setDeleteConfirm(e.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="text-rose-600 flex items-center gap-2">
                                    <AlertTriangle size={20} /> Delete Entry
                                  </DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this entry? This will recalculate all future balances.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => handleDeleteEntry(e.id)}
                                  >
                                    Delete
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredEntriesForDisplay.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center text-slate-400">
                          <FileText size={48} className="mb-2" />
                          <p className="font-medium">No entries found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white safe-bottom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <span>Ledger Audit Pro v2.0</span>
            <span>{filteredEntriesForDisplay.length} entries displayed</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
