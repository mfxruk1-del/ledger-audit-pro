import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const account = await db.account.findUnique({
      where: { id: params.id },
      include: {
        entries: {
          orderBy: { date: 'asc' }
        }
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Calculate running balances
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

    return NextResponse.json({
      ...account,
      entries: entriesWithRunning,
      credit: totalCredit,
      debit: totalDebit,
      balance: totalCredit - totalDebit
    })
  } catch (error) {
    console.error('Error fetching account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.account.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
