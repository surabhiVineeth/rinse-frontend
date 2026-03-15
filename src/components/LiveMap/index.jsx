import { useState, useCallback, useEffect } from 'react'
import { getOrders, getValets, getRoute } from '../../api'
import { usePolling } from '../../hooks/usePolling'
import { CLEANER_LOCATION } from '../../utils/statusConfig'
import MapView from './MapView'
import OrderSidebar from './OrderSidebar'
import TimelineDrawer from './TimelineDrawer'

// Build the correct waypoints for the route based on order status
function buildWaypoints(order) {
  const valet    = order.assigned_valet
  const customer = { lng: order.longitude, lat: order.latitude }
  const cleaner  = { lng: CLEANER_LOCATION.longitude, lat: CLEANER_LOCATION.latitude }

  if (!valet) return null

  const valetPos = { lng: valet.longitude, lat: valet.latitude }

  switch (order.status) {
    case 'dispatched':
      return [valetPos, customer]             // valet → customer
    case 'picked_up':
      return [customer, cleaner]              // customer → cleaner
    case 'ready':
      return [cleaner, customer]              // cleaner → customer
    default:
      return null
  }
}

export default function LiveMap({ onOrderCountChange }) {
  const [orders,        setOrders]        = useState([])
  const [valets,        setValets]        = useState([])
  const [statusFilter,  setStatusFilter]  = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [routeGeometry, setRouteGeometry] = useState(null)
  const [routeETA,      setRouteETA]      = useState(null)  // seconds

  // Fetch orders every 10 s
  const fetchOrders = useCallback(async () => {
    try {
      const res = await getOrders()
      setOrders(res.data)
      onOrderCountChange?.(res.data.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length)
      // Keep drawer in sync if status changed while open
      if (selectedOrder) {
        const updated = res.data.find((o) => o.id === selectedOrder.id)
        if (updated) setSelectedOrder(updated)
      }
    } catch (e) { console.error('Failed to fetch orders', e) }
  }, [selectedOrder, onOrderCountChange])

  const fetchValets = useCallback(async () => {
    try {
      const res = await getValets()
      setValets(res.data)
    } catch (e) { console.error('Failed to fetch valets', e) }
  }, [])

  usePolling(fetchOrders, 10_000)
  usePolling(fetchValets, 30_000)

  // Fetch route whenever selected order changes
  useEffect(() => {
    if (!selectedOrder) { setRouteGeometry(null); setRouteETA(null); return }
    const waypoints = buildWaypoints(selectedOrder)
    if (!waypoints) { setRouteGeometry(null); setRouteETA(null); return }

    getRoute(waypoints).then((route) => {
      if (route) {
        setRouteGeometry(route.geometry)
        setRouteETA(route.duration_sec)
      }
    }).catch(console.error)
  }, [selectedOrder?.id, selectedOrder?.status])

  const handleOrderClick = (order) => {
    setSelectedOrder(order)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedOrder(null)
    setRouteGeometry(null)
    setRouteETA(null)
  }

  // After cancel/advance in the drawer, refresh orders immediately
  const handleOrderUpdated = async () => {
    try {
      const res = await getOrders()
      setOrders(res.data)
      const updated = res.data.find((o) => o.id === selectedOrder?.id)
      if (updated) setSelectedOrder(updated)
    } catch (e) { console.error(e) }
  }

  const filteredOrders = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar hidden on mobile when drawer is open */}
      <div className={`${drawerOpen ? 'hidden md:flex' : 'flex'} flex-col shrink-0`}>
        <OrderSidebar
          orders={filteredOrders}
          allOrders={orders}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
          onOrderClick={handleOrderClick}
        />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView
          orders={orders}
          valets={valets}
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
