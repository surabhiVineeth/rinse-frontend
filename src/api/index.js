import axios from 'axios'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const SF_BBOX = '-122.5274,37.7034,-122.3482,37.8324'

// In dev: points to Django on localhost:8000
// In prod: set VITE_API_URL=https://your-railway-app.railway.app in Vercel env vars
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

// ── Orders ────────────────────────────────────────────────────────────────────

// GET /api/orders/           → all orders (optional ?status= filter)
export const getOrders = (status = null) => {
  const params = status ? { status } : {}
  return api.get('/api/orders/', { params })
}

// GET /api/orders/:id/       → single order with items + history
export const getOrder = (id) => api.get(`/api/orders/${id}/`)

// GET /api/orders/:id/timeline/  → id, status, history, total, items
export const getOrderTimeline = (id) => api.get(`/api/orders/${id}/timeline/`)

// POST /api/orders/          → create a new order
export const createOrder = (data) => api.post('/api/orders/', data)

// POST /api/orders/:id/advance/  → valet advances order to next status
export const advanceOrder = (id) => api.post(`/api/orders/${id}/advance/`)

// POST /api/orders/:id/cancel/      → cancel a scheduled order
export const cancelOrder = (id) => api.post(`/api/orders/${id}/cancel/`)

// POST /api/orders/:id/mark-ready/  → cleaner marks order ready for delivery
export const markOrderReady = (id) => api.post(`/api/orders/${id}/mark-ready/`)

// ── Valets ────────────────────────────────────────────────────────────────────

// GET /api/valets/
export const getValets = () => api.get('/api/valets/')

// GET /api/valets/:id/current-order/
export const getValetCurrentOrder = (valetId) =>
  api.get(`/api/valets/${valetId}/current-order/`)

// ── Catalog ───────────────────────────────────────────────────────────────────

// GET /api/items/
export const getItems = () => api.get('/api/items/')

// ── Mapbox ────────────────────────────────────────────────────────────────────

/**
 * Reverse geocode a lat/lng to a human-readable address string.
 * Returns a place_name string or null.
 */
export const reverseGeocode = async ({ lat, lng }) => {
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
    `?types=address&limit=1&access_token=${MAPBOX_TOKEN}`
  const res = await fetch(url)
  const data = await res.json()
  return data.features?.[0]?.place_name ?? null
}

/**
 * Address autocomplete locked to San Francisco.
 * Returns array of { place_name, center: [lng, lat] }
 */
export const geocodeAddress = async (query) => {
  if (!query || query.length < 3) return []
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?bbox=${SF_BBOX}&country=US&types=address,poi&limit=5&access_token=${MAPBOX_TOKEN}`
  const res = await fetch(url)
  const data = await res.json()
  return data.features ?? []
}

/**
 * Get a driving route between ordered waypoints.
 * waypoints = [{ lng, lat }, ...]
 * Returns { geometry (GeoJSON LineString), duration_sec, distance_m } or null
 */
export const getRoute = async (waypoints) => {
  if (waypoints.length < 2) return null
  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';')
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
    `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
  const res = await fetch(url)
  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) return null
  return {
    geometry:     route.geometry,
    duration_sec: route.duration,
    distance_m:   route.distance,
  }
}
