import { STATUS_CONFIG } from '../../utils/statusConfig'

const FILTERS = [
  { value: null,         label: 'All' },
  { value: 'scheduled',  label: 'Scheduled' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'picked_up',  label: 'Picked Up' },
  { value: 'at_cleaner', label: 'At Cleaner' },
  { value: 'ready',      label: 'Ready' },
  { value: 'delivered',  label: 'Delivered' },
  { value: 'cancelled',  label: 'Cancelled' },
]

// Haversine ETA (no extra API call) — used for list view
function calcETA(order) {
  const valet = order.assigned_valet
  if (!valet || !['dispatched', 'ready'].includes(order.status)) return null

  const R    = 3958.8
  const lat1 = valet.latitude  * Math.PI / 180
  const lat2 = order.latitude  * Math.PI / 180
  const dLat = (order.latitude  - valet.latitude)  * Math.PI / 180
  const dLng = (order.longitude - valet.longitude) * Math.PI / 180
  const a    = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const mins = Math.round(Math.max(1, (dist * 1.4 / 25) * 60))
  return mins
}

function fmt(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function OrderSidebar({ orders, allOrders, statusFilter, onFilterChange, onOrderClick }) {
  const total     = allOrders.length
  const active    = allOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length
  const delivered = allOrders.filter((o) => o.status === 'delivered').length

  return (
    <aside className="flex flex-col bg-white border-r border-gray-100 w-full md:w-80 h-full">

      {/* ── Stats bar ── */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-gray-100" style={{ background: '#1e1f21' }}>
        {[
          { label: 'Total',     value: total },
          { label: 'Active',    value: active },
          { label: 'Delivered', value: delivered },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-xl font-bold text-white leading-none">{value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Status filters ── */}
      <div className="flex gap-1.5 px-3 py-2.5 overflow-x-auto border-b border-gray-100 shrink-0">
        {FILTERS.map(({ value, label }) => {
          const isActive = statusFilter === value
          return (
            <button
              key={label}
              onClick={() => onFilterChange(value)}
              className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full transition-all whitespace-nowrap"
              style={isActive
                ? { background: '#cb6016', color: '#fff' }
                : { background: '#f3f4f6', color: '#6b7280' }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Order list ── */}
      <div className="flex-1 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <span className="text-3xl mb-2">📦</span>
            <p className="text-sm">No orders</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? {}
              const eta = calcETA(order)
              return (
                <li key={order.id}>
                  <button
                    onClick={() => onOrderClick(order)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-dark truncate">{order.customer_name}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{order.address}</p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0">#{order.id}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bgLight, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        {eta && (
                          <span className="font-medium" style={{ color: '#059669' }}>~{eta}m</span>
                        )}
                        {eta && <span>·</span>}
                        <span>{order.item_count} item{order.item_count !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>${parseFloat(order.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
