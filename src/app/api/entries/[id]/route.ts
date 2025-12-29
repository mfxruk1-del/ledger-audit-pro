import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { date, particulars, amount, type } = body

    // Validation
    if (type && !['credit', 'debit'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either credit or debit' },
        { status: 400 }
      )
    }

    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be a positive number' },
          { status: 400 }
        )
      }
    }

    const entry = await db.entry.update({
      where: { id: params.id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(particulars && { particulars: particulars.trim() }),
        ...(amount && { amount: Math.abs(parseFloat(amount)) }),
        ...(type && { type })
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error updating entry:', error)
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.entry.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    )
  }
}
