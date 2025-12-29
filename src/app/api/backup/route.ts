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

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `audit_backup_${timestamp}.json`

    return new NextResponse(JSON.stringify(accounts, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting backup:', error)
    return NextResponse.json(
      { error: 'Failed to export backup' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accounts } = body

    if (!Array.isArray(accounts)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    let createdCount = 0

    for (const account of accounts) {
      // Create account without entries first
      const { entries, ...accountData } = account
      const newAccount = await db.account.create({
        data: accountData
      })

      // Create entries for this account
      if (entries && Array.isArray(entries) && entries.length > 0) {
        await db.entry.createMany({
          data: entries.map((entry: any) => ({
            ...entry,
            accountId: newAccount.id,
            date: new Date(entry.date)
          }))
        })
      }

      createdCount++
    }

    return NextResponse.json({
      success: true,
      imported: createdCount
    })
  } catch (error) {
    console.error('Error importing backup:', error)
    return NextResponse.json(
      { error: 'Failed to import backup' },
      { status: 500 }
    )
  }
}
