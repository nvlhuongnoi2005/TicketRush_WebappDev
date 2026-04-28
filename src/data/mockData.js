export const categories = [
  'Music',
  'Sports',
  'Theater',
  'Comedy',
  'Festival',
  'Workshop',
  'Tech',
  'Family',
]

export const events = [
  {
    id: 1,
    category: 'Music',
    title: 'BLACKPINK World Tour',
    artist: 'BLACKPINK',
    venue_name: 'My Dinh National Stadium',
    venue_address: 'Hanoi, Vietnam',
    event_date: '2026-06-15T19:00:00',
    status: 'on_sale',
    min_price: 800000,
    total_seats: 5000,
    available_seats: 3200,
    banner_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    description:
      'A spectacular night of live music, lights, and fan energy featuring one of the world\'s biggest pop acts.',
    queue_enabled: true,
    sections: [
      { id: 11, name: 'VIP', rows: 5, cols: 20, price: 2000000, color: '#E94560', total_seats: 100, available_seats: 65 },
      { id: 12, name: 'A', rows: 10, cols: 25, price: 1200000, color: '#4CAF50', total_seats: 250, available_seats: 130 },
      { id: 13, name: 'B', rows: 12, cols: 30, price: 800000, color: '#2196F3', total_seats: 360, available_seats: 210 },
    ],
  },
  {
    id: 2,
    category: 'Festival',
    title: 'Summer Festival 2026',
    artist: 'Various Artists',
    venue_name: 'Ho Chi Minh City Creative Park',
    venue_address: 'Ho Chi Minh City, Vietnam',
    event_date: '2026-07-20T17:30:00',
    status: 'on_sale',
    min_price: 500000,
    total_seats: 4200,
    available_seats: 2800,
    banner_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
    description:
      'A full-day outdoor festival with live bands, food stalls, and interactive fan zones.',
    queue_enabled: false,
    sections: [
      { id: 21, name: 'Front Stage', rows: 4, cols: 18, price: 1500000, color: '#FF9800', total_seats: 72, available_seats: 32 },
      { id: 22, name: 'GA', rows: 12, cols: 25, price: 500000, color: '#8BC34A', total_seats: 300, available_seats: 180 },
    ],
  },
  {
    id: 3,
    category: 'Tech',
    title: 'Tech Conference 2026',
    artist: 'TicketRush Labs',
    venue_name: 'Da Nang Convention Center',
    venue_address: 'Da Nang, Vietnam',
    event_date: '2026-08-12T09:00:00',
    status: 'upcoming',
    min_price: 300000,
    total_seats: 2000,
    available_seats: 2000,
    banner_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    description:
      'A two-day conference for developers, designers, and product teams exploring modern ticketing workflows.',
    queue_enabled: false,
    sections: [
      { id: 31, name: 'Hall A', rows: 8, cols: 20, price: 1200000, color: '#9C27B0', total_seats: 160, available_seats: 160 },
      { id: 32, name: 'Hall B', rows: 10, cols: 15, price: 300000, color: '#03A9F4', total_seats: 150, available_seats: 150 },
    ],
  },
]

export const tickets = [
  {
    id: 1,
    event_title: 'BLACKPINK World Tour',
    event_date: '2026-06-15T19:00:00',
    venue_name: 'My Dinh National Stadium',
    seat_label: 'VIP-A01',
    section_name: 'VIP',
    qr_data: 'TR-000001-ABCD1234',
    qr_image_url: 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=TR-000001-ABCD1234',
    status: 'valid',
    price: 2000000,
  },
  {
    id: 2,
    event_title: 'Summer Festival 2026',
    event_date: '2026-07-20T17:30:00',
    venue_name: 'Ho Chi Minh City Creative Park',
    seat_label: 'GA-C14',
    section_name: 'GA',
    qr_data: 'TR-000002-EFGH5678',
    qr_image_url: 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=TR-000002-EFGH5678',
    status: 'used',
    price: 500000,
  },
]

export const adminStats = {
  total_events: 3,
  active_events: 2,
  total_tickets_sold: 1250,
  total_revenue: 2500000000,
  pending_orders: 8,
  recent_revenue: [
    { date: '2026-04-22', revenue: 50000000, tickets_sold: 25 },
    { date: '2026-04-23', revenue: 42000000, tickets_sold: 21 },
    { date: '2026-04-24', revenue: 61000000, tickets_sold: 33 },
    { date: '2026-04-25', revenue: 73000000, tickets_sold: 41 },
    { date: '2026-04-26', revenue: 54000000, tickets_sold: 28 },
    { date: '2026-04-27', revenue: 68000000, tickets_sold: 35 },
    { date: '2026-04-28', revenue: 82000000, tickets_sold: 48 },
  ],
  audience: {
    gender_male: 650,
    gender_female: 580,
    gender_other: 20,
    age_under_18: 120,
    age_18_25: 480,
    age_26_35: 390,
    age_36_45: 180,
    age_above_45: 80,
  },
}

export const queueStatus = {
  event_id: 1,
  position: 105,
  total_in_queue: 312,
  is_admitted: false,
  message: 'You are currently in position 105 in the queue.',
}

export function getEventById(id) {
  return events.find((event) => event.id === Number(id))
}

export function getTicketById(id) {
  return tickets.find((ticket) => ticket.id === Number(id))
}

export function createSeatGrid(section, rowLabelPrefix = 'A') {
  const seats = []

  for (let row = 1; row <= section.rows; row += 1) {
    for (let col = 1; col <= section.cols; col += 1) {
      seats.push({
        id: section.id * 1000 + row * 100 + col,
        label: `${section.name}-${rowLabelPrefix}${String(col).padStart(2, '0')}`,
        status:
          col % 11 === 0 ? 'sold' : col % 7 === 0 ? 'locked' : col % 5 === 0 ? 'available' : 'available',
        price: section.price,
        locked_by_me: col % 13 === 0,
      })
    }
  }

  return seats
}
