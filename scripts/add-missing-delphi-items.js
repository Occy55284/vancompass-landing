// Script to add missing Delphi items from 06.08.2026 PDF
// Run with: node scripts/add-missing-delphi-items.js

const missingEvents = [
  {
    date: '7 August 2026',
    beoNumber: 'DELPHI-0801',
    eventName: 'Academy Doughnut Bar',
    room: 'The Academy',
    dietaryRequirements: '',
    company: 'company-a',
    items: [
      {
        name: 'Doughnut Bar',
        quantity: 12,
        time: '10:45',
        allergens: '',
        details: 'Selection of assorted doughnuts',
        notes: '',
        totalQty: 12,
        service: 'BREAKFAST',
        isBeverage: false,
        isSnack: false
      }
    ]
  },
  {
    date: '7 August 2026',
    beoNumber: 'DELPHI-0802',
    eventName: 'Wembley Lunch Service',
    room: 'Wembley',
    dietaryRequirements: '',
    company: 'company-a',
    items: [
      {
        name: 'Sandwich Lunch Platter',
        quantity: 28,
        time: '13:20',
        allergens: '',
        details: 'Assorted sandwich selection',
        notes: '',
        totalQty: 28,
        service: 'LUNCH',
        isBeverage: false,
        isSnack: false
      },
      {
        name: 'Bowl Food Selection',
        quantity: 28,
        time: '13:20',
        allergens: '',
        details: 'All bowl food items',
        notes: '',
        totalQty: 28,
        service: 'LUNCH',
        isBeverage: false,
        isSnack: false
      },
      {
        name: 'Fries',
        quantity: 28,
        time: '13:20',
        allergens: 'V,GF',
        details: 'Crispy fried potatoes',
        notes: '',
        totalQty: 28,
        service: 'LUNCH',
        isBeverage: false,
        isSnack: false
      }
    ]
  },
  {
    date: '10 August 2026',
    beoNumber: 'DELPHI-0803',
    eventName: 'Chestnut Room Morning Service',
    room: 'The Chestnut Room',
    dietaryRequirements: '',
    company: 'company-a',
    items: [
      {
        name: 'Full Breakfast Service',
        quantity: 12,
        time: '08:30',
        allergens: '',
        details: 'All breakfast items - complete menu',
        notes: '',
        totalQty: 12,
        service: 'BREAKFAST',
        isBeverage: false,
        isSnack: false
      }
    ]
  },
  {
    date: '10 August 2026',
    beoNumber: 'DELPHI-0804',
    eventName: 'Chestnut Room Afternoon Service',
    room: 'The Chestnut Room',
    dietaryRequirements: '',
    company: 'company-a',
    items: [
      {
        name: 'Full Service Menu',
        quantity: 12,
        time: '12:00',
        allergens: '',
        details: 'All items - complete menu for afternoon service',
        notes: '',
        totalQty: 12,
        service: 'LUNCH',
        isBeverage: false,
        isSnack: false
      }
    ]
  }
]

async function addMissingItems() {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/add-missing-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: missingEvents })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Error:', result.error)
      process.exit(1)
    }

    console.log('✓ Successfully added missing items:')
    console.log(`  - ${missingEvents.length} events added`)
    console.log(`  - Dates: 7 August 2026, 10 August 2026`)
    console.log('\nDetails:')
    missingEvents.forEach(ev => {
      console.log(`  • ${ev.eventName} (${ev.room}) on ${ev.date}`)
    })
  } catch (error) {
    console.error('Failed to add missing items:', error.message)
    process.exit(1)
  }
}

addMissingItems()
