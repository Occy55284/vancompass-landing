import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_COMPANY_ID } from '../../companies'

export async function POST(request) {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  try {
    const { events } = await request.json()

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 })
    }

    // Get the latest stored data
    const { data: previousUploads, error: fetchError } = await supabase
      .from('beo_uploads')
      .select('id, uploaded_at, summary')
      .order('uploaded_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      throw new Error(`Failed to fetch previous data: ${fetchError.message}`)
    }

    let storedDays = []
    if (previousUploads && previousUploads.length > 0) {
      storedDays = previousUploads[0].summary || []
    }

    // Merge the new events into the stored data
    const updatedDays = mergeNewEvents(storedDays, events)

    // Save the updated data
    const { error: insertError } = await supabase
      .from('beo_uploads')
      .insert({
        week_type: 'all',
        summary: updatedDays,
        uploaded_at: new Date().toISOString()
      })

    if (insertError) {
      throw new Error(`Failed to save data: ${insertError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: `Added ${events.length} missing item(s)`,
      data: { days: updatedDays }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to add missing items: ' + error.message },
      { status: 500 }
    )
  }
}

function mergeNewEvents(storedDays, newEvents) {
  const map = new Map()

  // Keep existing data
  storedDays.forEach(d => {
    map.set(d.date, { ...d, events: [...(d.events || [])] })
  })

  // Add or update with new events
  newEvents.forEach(newEv => {
    const day = map.get(newEv.date)
    if (!day) {
      map.set(newEv.date, {
        date: newEv.date,
        shortDate: newEv.date.substring(0, 10),
        events: [newEv]
      })
    } else {
      // Check if event with same BEO number exists
      const existingIdx = day.events.findIndex(e => e.beoNumber === newEv.beoNumber)
      if (existingIdx >= 0) {
        // Update existing event
        day.events[existingIdx] = newEv
      } else {
        // Add new event
        day.events.push(newEv)
      }
    }
  })

  // Sort by date
  return Array.from(map.values()).sort((a, b) => {
    const MONTHS = { January:0, February:1, March:2, April:3, May:4, June:5,
      July:6, August:7, September:8, October:9, November:10, December:11 }
    const parseDate = d => {
      const p = d.split(' ')
      return new Date(parseInt(p[2]), MONTHS[p[1]] || 0, parseInt(p[0]))
    }
    return parseDate(a.date) - parseDate(b.date)
  })
}
