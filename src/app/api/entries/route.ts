import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountId, date, particulars, amount, type } = body

    // Validation
    if (!accountId || !date || !particulars || !amount || !type) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!['credit', 'debit'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either credit or debit' },
        { status: 400 }
      )
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Verify account exists
    const account = await db.account.findUnique({
      where: { id: accountId }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    const entry = await db.entry.create({
      data: {
        accountId,
        date: new Date(date),
        particulars: particulars.trim(),
        amount: Math.abs(parseFloat(amount)),
        type
      }
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating entry:', error)
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    )
  }
}
