import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const accounts = await db.account.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        entries: {
          orderBy: { date: 'asc' }
        }
      }
    })

    // Calculate balances for each account
    const accountsWithBalances = accounts.map(account => {
      let running = 0
      let totalCredit = 0
      let totalDebit = 0

      const entriesWithRunning = account.entries.map(entry => {
        if (entry.type === 'credit') {
          running += entry.amount
          totalCredit += entry.amount
        } else {
          running -= entry.amount
          totalDebit += entry.amount
        }
        return {
          ...entry,
          runningBalance: running
        }
      })

      return {
        ...account,
        entries: entriesWithRunning,
        credit: totalCredit,
        debit: totalDebit,
        balance: totalCredit - totalDebit
      }
    })

    return NextResponse.json(accountsWithBalances)
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const account = await db.account.create({
      data: {
        name: name.trim()
      }
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
