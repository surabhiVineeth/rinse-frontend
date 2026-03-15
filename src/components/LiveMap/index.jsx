import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { getOrders, getValets, getRoute } from '../../api'
import { usePolling } from '../../hooks/usePolling'
import { useToast } from '../../hooks/useToast'
import { CLEANER_LOCATION } from '../../utils/statusConfig'
import MapView from './MapView'
import OrderSidebar from './OrderSidebar'
import TimelineDrawer from './TimelineDrawer'
import ToastContainer from '../ToastContainer'

const STATUS_TOASTS = {
  dispatched: (o) => ({ icon: '🛵', type: 'orange',  title: `Order #${o.id} dispatched`,    subtitle: `${o.assigned_valet?.name ?? 'Valet'} is on the way` }),
  picked_up:  (o) => ({ icon: '📦', type: 'info',    title: `Order #${o.id} picked up`,      subtitle: `Heading to the cleaner` }),
  at_cleaner: (o) => ({ icon: '👕', type: 'info',    title: `Order #${o.id} at cleaner`,     subtitle: 'Being processed' }),
  ready:      (o) => ({ icon: '✅', type: 'success',  title: `Order #${o.id} ready`,          subtitle: `Out for delivery to ${o.customer_name}` }),
  delivered:  (o) => ({ icon: '🎉', type: 'success',  title: `Order #${o.id} delivered!`,    subtitle: `${o.customer_name}'s laundry is home` }),
  cancelled:  (o) => ({ icon: '❌', type: 'error',    title: `Order #${o.id} cancelled`,     subtitle: o.customer_name }),
}

const ACTIVE_STATUSES = new Set(['dispatched', 'picked_up', 'ready'])
const TICK_MS        = 2_000   // animation tick
const STEP_PER_TICK  = 0.015   // advance 1.5% of route per tick (~2 min to complete)

// ── Route waypoints per status ────────────────────────────────────────────────
function buildWaypoints(order) {
  const valet    = order.assigned_valet
  const customer = { lng: order.longitude,             lat: order.latitude }
  const cleaner  = { lng: CLEANER_LOCATION.longitude,  lat: CLEANER_LOCATION.latitude }
  if (!valet) return null
  const valetPos = { lng: valet.longitude, lat: valet.latitude }
  switch (order.status) {
    case 'dispatched': return [valetPos, customer]
    case 'picked_up':  return [customer, cleaner]
    case 'ready':      return [cleaner,  customer]
    default:           return null
  }
}

// ── Interpolate a lat/lng position along a GeoJSON coordinate array ──────────
function positionAlongCoords(coords, progress) {
  if (!coords?.length) return null
  const last = coords.length - 1
  const t    = Math.min(Math.max(progress, 0), 1) * last
  const i    = Math.floor(t)
  const f    = t - i
  if (i >= last) return { lat: coords[last][1], lng: coords[last][0] }
  const [lng1, lat1] = coords[i]
  const [lng2, lat2] = coords[i + 1]
  return { lat: lat1 + (lat2 - lat1) * f, lng: lng1 + (lng2 - lng1) * f }
}

// ── Slice route coords from the valet's current position to the end ───────────
function remainingRouteCoords(coords, progress) {
  if (!coords?.length) return coords
  const last = coords.length - 1
  const t    = Math.min(Math.max(progress, 0), 1) * last
  const i    = Math.floor(t)
  const f    = t - i
  if (i >= last) return [coords[last]]
  const [lng1, lat1] = coords[i]
  const [lng2, lat2] = coords[i + 1]
  const current = [lng1 + (lng2 - lng1) * f, lat1 + (lat2 - lat1) * f]
  return [current, ...coords.slice(i + 1)]
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LiveMap({ onOrderCountChange }) {
  const [orders,       setOrders]       = useState([])
  const [valets,       setValets]       = useState([])
  const [statusFilter, setStatusFilter] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [drawerOpen,   setDrawerOpen]   = useState(false)

  // orderRoutes: { [orderId]: { coords, progress, status, duration_sec } }
  const [orderRoutes, setOrderRoutes] = useState({})

  const { toasts, addToast, dismiss } = useToast()

  // Track which (orderId-status) pairs we've already fetched to avoid duplicates
  const fetchedRef    = useRef({})
  const prevStatusRef = useRef({}) // { [orderId]: status } — for toast detection
  const ordersRef     = useRef(orders)
  useEffect(() => { ordersRef.current = orders }, [orders])

  // ── Fetch routes for all active orders ──────────────────────────────────────
  useEffect(() => {
    const activeOrders = orders.filter(
      o => ACTIVE_STATUSES.has(o.status) && o.assigned_valet
    )

    activeOrders.forEach(async (order) => {
      const key = `${order.id}-${order.status}`
      if (fetchedRef.current[key]) return
      fetchedRef.current[key] = true

      const waypoints = buildWaypoints(order)
      if (!waypoints) return

      try {
        const route = await getRoute(waypoints)
        if (!route?.geometry?.coordinates) return
        setOrderRoutes(prev => ({
          ...prev,
          [order.id]: {
            coords:       route.geometry.coordinates,
            progress:     0,
            status:       order.status,
            duration_sec: route.duration_sec,
          },
        }))
      } catch (e) {
        fetchedRef.current[key] = false // allow retry
        console.error(e)
      }
    })

    // Remove routes for orders that are no longer active
    setOrderRoutes(prev => {
      const activeIds = new Set(activeOrders.map(o => String(o.id)))
      const stale = Object.keys(prev).filter(id => !activeIds.has(id))
      if (stale.length === 0) return prev
      const next = { ...prev }
      stale.forEach(id => delete next[id])
      return next
    })
  }, [orders])

  // ── Animation tick — advance progress along stored route coords ───────────
  useEffect(() => {
    const id = setInterval(() => {
      const activeIds = new Set(
        ordersRef.current
          .filter(o => ACTIVE_STATUSES.has(o.status) && o.assigned_valet)
          .map(o => String(o.id))
      )
      if (activeIds.size === 0) return

      setOrderRoutes(prev => {
        let changed = false
        const next = {}
        Object.keys(prev).forEach(id => {
          const r = prev[id]
          if (activeIds.has(id) && r.progress < 0.98) {
            next[id] = { ...r, progress: r.progress + STEP_PER_TICK }
            changed = true
          } else {
            next[id] = r
          }
        })
        return changed ? next : prev
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])

  // ── Derived: valet display positions (follow route coords) ────────────────
  const displayValets = useMemo(() => {
    return valets.map(v => {
      const order = orders.find(
        o => o.assigned_valet?.id === v.id && ACTIVE_STATUSES.has(o.status)
      )
      if (!order) return { ...v, moving: false }

      const route = orderRoutes[order.id]
      if (!route?.coords) return { ...v, moving: false }

      const pos = positionAlongCoords(route.coords, route.progress)
      if (!pos) return { ...v, moving: false }

      return { ...v, latitude: pos.lat, longitude: pos.lng, moving: true }
    })
  }, [valets, orders, orderRoutes])

  // ── Derived: remaining route geometry for selected order ──────────────────
  const routeGeometry = useMemo(() => {
    if (!selectedOrder) return null
    const route = orderRoutes[selectedOrder.id]
    if (!route?.coords) return null
    const remaining = remainingRouteCoords(route.coords, route.progress)
    if (remaining.length < 2) return null
    return { type: 'LineString', coordinates: remaining }
  }, [selectedOrder?.id, orderRoutes])

  // ── Derived: ETA = remaining fraction of original duration ───────────────
  const routeETA = useMemo(() => {
    if (!selectedOrder) return null
    const route = orderRoutes[selectedOrder.id]
    if (!route?.duration_sec) return null
    return Math.round(route.duration_sec * (1 - route.progress))
  }, [selectedOrder?.id, orderRoutes])

  // ── Polling ───────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await getOrders()
      setOrders(res.data)
      onOrderCountChange?.(
        res.data.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length
      )
      if (selectedOrder) {
        const updated = res.data.find(o => o.id === selectedOrder.id)
        if (updated) setSelectedOrder(updated)
      }

      // Detect status changes and fire toasts
      const prev = prevStatusRef.current
      const isFirstLoad = Object.keys(prev).length === 0
      res.data.forEach(o => {
        if (!isFirstLoad && prev[o.id] && prev[o.id] !== o.status) {
          const builder = STATUS_TOASTS[o.status]
          if (builder) addToast(builder(o))
        }
        prev[o.id] = o.status
      })
    } catch (e) { console.error('Failed to fetch orders', e) }
  }, [selectedOrder, onOrderCountChange, addToast])

  const fetchValets = useCallback(async () => {
    try {
      const res = await getValets()
      setValets(res.data)
    } catch (e) { console.error('Failed to fetch valets', e) }
  }, [])

  usePolling(fetchOrders, 10_000)
  usePolling(fetchValets, 30_000)

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOrderClick = (order) => { setSelectedOrder(order); setDrawerOpen(true) }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedOrder(null)
  }

  const handleOrderUpdated = async () => {
    try {
      const res = await getOrders()
      setOrders(res.data)
      const updated = res.data.find(o => o.id === selectedOrder?.id)
      if (updated) setSelectedOrder(updated)
    } catch (e) { console.error(e) }
  }

  const filteredOrders = statusFilter
    ? orders.filter(o => o.status === statusFilter)
    : orders

  return (
    <div className="flex h-full overflow-hidden">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className={`${drawerOpen ? 'hidden md:flex' : 'flex'} flex-col shrink-0`}>
        <OrderSidebar
          orders={filteredOrders}
          allOrders={orders}
          orderRoutes={orderRoutes}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
          onOrderClick={handleOrderClick}
        />
      </div>

      <div className="flex-1 relative">
        <MapView
          orders={orders}
          valets={displayValets}
          routeGeometry={routeGeometry}
          onOrderClick={handleOrderClick}
        />

        {drawerOpen && (
          <TimelineDrawer
            order={selectedOrder}
            routeETA={routeETA}
            onClose={handleCloseDrawer}
            onOrderUpdated={handleOrderUpdated}
          />
        )}
      </div>
    </div>
  )
}
