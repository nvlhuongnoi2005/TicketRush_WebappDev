import { events as initialEvents, getEventById as getInitialEventById } from '../data/mockData'

const EVENTS_KEY = 'ticketrush_events'

function normalizeEvent(event) {
  return {
    category: 'Music',
    ...event,
  }
}

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

export function getEvents() {
  return readJSON(EVENTS_KEY, initialEvents).map(normalizeEvent)
}

export function setEvents(nextEvents) {
  const normalizedEvents = nextEvents.map(normalizeEvent)
  writeJSON(EVENTS_KEY, normalizedEvents)
  return normalizedEvents
}

export function addEvent(event) {
  const nextEvents = [event, ...getEvents()]
  return setEvents(nextEvents)
}

export function updateEvent(eventId, patch) {
  const nextEvents = getEvents().map((event) =>
    event.id === Number(eventId) ? { ...event, ...patch } : event,
  )
  return setEvents(nextEvents)
}

export function deleteEvent(eventId) {
  const nextEvents = getEvents().filter((event) => event.id !== Number(eventId))
  return setEvents(nextEvents)
}

export function getEventById(eventId) {
  const events = getEvents()
  const found = events.find((event) => event.id === Number(eventId))
  return found || getInitialEventById(eventId)
}

export function seedEventsIfNeeded() {
  const existing = localStorage.getItem(EVENTS_KEY)
  if (!existing) {
    setEvents(initialEvents)
  }
}
