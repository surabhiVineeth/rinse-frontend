import { useState, useCallback } from 'react'
import { getOrders, markOrderReady } from '../../api'
import { usePolling } from '../../hooks/usePolling'

function timeAgo(ts) {
  const mins = Math.floor((Date.now() - new Date(ts)) / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`
}

function OrderCard({ order, onMarkedReady }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const lastEvent = order.history?.[order.history.length - 1]

  const handleMarkReady = async () => {
    setLoading(true)
    setError('')
    try {
      await markOrderReady(order.id)
      onMarkedReady()
    } catch (e) {
      setError(e.response?.data?.error ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-brand-dark">{order.customer_name}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{order.address}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-semibold" style={{ color: '#cb6016' }}>Order #{order.id}</p>
          {lastEvent && (
            <p className="text-xs text-gray-400 mt-0.5">
              Arrived {timeAgo(lastEvent.timestamp)}
            </p>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1">
        {order.order_items?.map(item => (
          <div key={item.id} className="flex justify-between text-xs text-gray-600">
            <span>{item.clothing_item.icon} {item.clothing_item.name} ×{item.quantity}</span>
            <span className="text-gray-400">${(parseFloat(item.clothing_item.price) * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between text-xs font-semibold text-brand-dark pt-1 border-t border-gray-200 mt-1">
          <span>Total</span>
          <span>${parseFloat(order.total).toFixed(2)}</span>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Action */}
      <button
        onClick={handleMarkReady}
        disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
        style={{ background: 'linear-gradient(225deg, #00a3ad, #1d6076)' }}
      >
        {loading ? 'Marking ready…' : '✅ Mark Ready for Pickup'}
      </button>
    </div>
  )
}

export default function CleanerView() {
  const [orders, setOrders] = useState([])

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getOrders('at_cleaner')
      setOrders(res.data)
    } catch (e) { console.error(e) }
  }, [])

  usePolling(fetchOrders, 15_000)

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(225deg, #00a3ad, #1d6076)' }}
          >
            👕
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark">Cleaner Portal</h1>
            <p className="text-sm text-gray-500">Rinse Cleaning Partner · 340 Brannan St</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="live-dot" />
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: orders.length ? '#fef3c7' : '#f3f4f6', color: orders.length ? '#d97706' : '#9ca3af' }}
            >
              {orders.length} pending
            </span>
          </div>
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4">✨</span>
            <p className="text-base font-semibold">All caught up!</p>
            <p className="text-sm mt-1">No orders at the cleaner right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} onMarkedReady={fetchOrders} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
