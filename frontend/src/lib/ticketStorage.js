import { tickets as demoTickets } from '../data/mockData'

const ORDERS_KEY = 'ticketrush_orders'
const EXTRA_TICKETS_KEY = 'ticketrush_extra_tickets'

function readJSON(key, fallback) {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback

  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getOrders() {
  return readJSON(ORDERS_KEY, [])
}

export function saveOrder(order) {
  const orders = getOrders()
  const existingIndex = orders.findIndex((item) => item.id === order.id)

  if (existingIndex >= 0) {
    orders[existingIndex] = order
  } else {
    orders.unshift(order)
  }

  writeJSON(ORDERS_KEY, orders)
  return order
}

export function updateOrderStatus(orderId, status) {
  const orders = getOrders()
  const updatedOrders = orders.map((order) =>
    order.id === orderId ? { ...order, status, paid_at: status === 'paid' ? new Date().toISOString() : order.paid_at } : order,
  )

  writeJSON(ORDERS_KEY, updatedOrders)
  return updatedOrders.find((order) => order.id === orderId)
}

export function getExtraTickets() {
  return readJSON(EXTRA_TICKETS_KEY, [])
}

export function saveExtraTickets(newTickets) {
  const currentTickets = getExtraTickets()
  writeJSON(EXTRA_TICKETS_KEY, [...newTickets, ...currentTickets])
}

export function getTickets() {
  return [...getExtraTickets(), ...demoTickets]
}

export function createTicketsForOrder({ order, event, seats, user }) {
  return seats.map((seat, index) => ({
    id: Number(`${order.id}${index + 1}`),
    order_id: order.id,
    seat_id: seat.id,
    event_id: event.id,
    user_id: user?.id || 0,
    event_title: event.title,
    event_date: event.event_date,
    venue_name: event.venue_name,
    seat_label: seat.label,
    section_name: event.sections.find((section) => section.price === seat.price)?.name || 'General',
    qr_data: `TR-${String(order.id).padStart(6, '0')}-${seat.id}`,
    qr_image_url: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=TR-${String(order.id).padStart(6, '0')}-${seat.id}`,
    status: 'valid',
    price: seat.price,
    issued_at: new Date().toISOString(),
  }))
}
