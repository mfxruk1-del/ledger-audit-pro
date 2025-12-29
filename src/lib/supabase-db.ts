import { supabase } from './supabase'

export interface Account {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Entry {
  id: string
  user_id: string
  account_id: string
  date: string
  particulars: string
  amount: number
  type: 'credit' | 'debit'
  created_at: string
  updated_at: string
}

export interface AccountWithEntries extends Account {
  entries: Entry[]
}

// Account operations
export async function getAccounts() {
  const { data, error } = await supabase
    .from('accounts')
    .select(`
      *,
      entries (*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AccountWithEntries[] || []
}

export async function createAccount(name: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('accounts')
    .insert([{ name, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAccount(accountId: string) {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', accountId)

  if (error) throw error
}

// Entry operations
export async function createEntry(entry: Omit<Entry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('entries')
    .insert([{ ...entry, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEntry(entryId: string, updates: Partial<Entry>) {
  const { error } = await supabase
    .from('entries')
    .update(updates)
    .eq('id', entryId)

  if (error) throw error
}

export async function deleteEntry(entryId: string) {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', entryId)

  if (error) throw error
}

// Real-time subscription
export function subscribeToEntries(
  accountId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`entries:${accountId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'entries',
        filter: `account_id=eq.${accountId}`,
      },
      callback
    )
    .subscribe()
}

export function subscribeToAccounts(callback: (payload: any) => void) {
  return supabase
    .channel('accounts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'accounts',
      },
      callback
    )
    .subscribe()
}
