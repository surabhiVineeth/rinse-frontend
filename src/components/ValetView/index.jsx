import { useState, useEffect, useCallback } from 'react'
import { getValets, getValetCurrentOrder, advanceOrder } from '../../api'
import { STATUS_CONFIG, STATUS_ORDER, VALET_ACTION_LABEL } from '../../utils/statusConfig'

const VALET_STATUS_STYLE = {
  available:   { bg: '#ecfdf5', color: '#059669', label: 'Available' },
  on_pickup:   { bg: '#eff6ff', color: '#3b82f6', label: 'On Pickup' },
  on_delivery: { bg: '#f5f3ff', color: '#7c3aed', label: 'On Delivery' },
  off_duty:    { bg: '#f3f4f6', color: '#6b7280', label: 'Off Duty' },
}

function fmt(ts) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function ValetView() {
  const [valets,       setValets]       = useState([])
  const [selectedId,   setSelectedId]   = useState('')
  const [order,        setOrder]        = useState(null)   // active order or null
  const [noOrder,      setNoOrder]      = useState(false)
  const [advancing,    setAdvancing]    = useState(false)
  const [advanceError, setAdvanceError] = useState('')

  // Load valets once
  useEffect(() => {
    getValets().then((r) => {
      setValets(r.data)
      if (r.data.length) setSelectedId(String(r.data[0].id))
    }).catch(console.error)
  }, [])

  // Fetch active order whenever selected valet changes
  const fetchOrder = useCallback(async () => {
    if (!selectedId) return
    setNoOrder(false)
    setOrder(null)
    try {
      const res = await getValetCurrentOrder(selectedId)
      setOrder(res.data)
    } catch (err) {
      if (err.response?.status === 404) setNoOrder(true)
      else console.error(err)
    }
  }, [selectedId])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  const handleAdvance = async () => {
    if (!order) return
    setAdvancing(true)
    setAdvanceError('')
    try {
      const res = await advanceOrder(order.id)
      setOrder(res.data)
      // If delivered, order is done — show no-order state after a beat
      if (res.data.status === 'delivered') {
        setTimeout(() => { setOrder(null); setNoOrder(true) }, 1200)
      }
    } catch (err) {
      setAdvanceError(err.response?.data?.error ?? 'Something went wrong.')
    } finally {
      setAdvancing(false)
    }
  }

  const selectedValet = valets.find((v) => String(v.id) === selectedId)
  const valetStyle    = VALET_STATUS_STYLE[selectedValet?.status] ?? VALET_STATUS_STYLE.available
  const actionLabel   = order ? VALET_ACTION_LABEL[order.status] : null
  const currentStep   = order ? STATUS_ORDER.indexOf(order.status) : -1

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6 space-y-5">

        {/* ── Valet selector ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Select Valet</p>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-brand-dark focus:outline-none focus:ring-2 transition bg-white"
          >
            {valets.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>

          {selectedValet && (
            <div className="flex items-center gap-2 mt-3">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: valetStyle.bg, color: valetStyle.color }}
              >
                {valetStyle.label}
              </span>
              <span className="text-xs text-gray-400">
                {selectedValet.completed_orders_count} deliveries completed
              </span>
            </div>
          )}
        </div>

        {/* ── No active order ── */}
        {noOrder && !order && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-3">🛵</div>
            <p className="text-sm font-semibold text-brand-dark">No active assignment</p>
            <p className="text-xs text-gray-400 mt-1">
              This valet is free. The scheduler will assign an order automatically.
            </p>
          </div>
        )}

        {/* ── Active order card ── */}
        {order && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Card header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Order #{order.id}</p>
                  <h2 className="text-base font-bold text-brand-dark">{order.customer_name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{order.address}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 mt-0.5 status-${order.status}`}
                >
                  {STATUS_CONFIG[order.status]?.label}
                </span>
              </div>
            </div>

            {/* Progress stepper */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center">
                {STATUS_ORDER.map((status, idx) => {
                  const done    = idx <= currentStep
                  const current = idx === currentStep
                  const cfg     = STATUS_CONFIG[status]
                  const isLast  = idx === STATUS_ORDER.length - 1
                  return (
                    <div key={status} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-3 h-3 rounded-full border-2 transition-all duration-300"
                          style={{
                            background:  done ? cfg.color : '#fff',
                            borderColor: done ? cfg.color : '#d1d5db',
                            boxShadow:   current ? `0 0 0 3px ${cfg.color}33` : 'none',
                          }}
                        />
                        <span className="text-xs text-gray-400 mt-1 hidden sm:block" style={{ fontSize: 9 }}>
                          {cfg.label.split(' ')[0]}
                        </span>
                      </div>
                      {!isLast && (
                        <div
                          className="flex-1 h-0.5 mx-0.5 transition-all duration-300"
                          style={{ background: idx < currentStep ? cfg.color : '#e5e7eb' }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Items */}
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Items</p>
              <div className="space-y-1.5">
                {order.order_items?.map((oi) => (
                  <div key={oi.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">
                      {oi.clothing_item.icon} {oi.clothing_item.name}
                      <span className="text-gray-400 ml-1">×{oi.quantity}</span>
                    </span>
                    <span className="text-gray-600 font-medium">
                      ${parseFloat(oi.subtotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm font-semibold text-brand-dark">Total</span>
                <span className="text-sm font-bold" style={{ color: '#cb6016' }}>
                  ${parseFloat(order.total).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action button */}
            <div className="px-5 py-4">
              {advanceError && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-3">
                  {advanceError}
                </p>
              )}

              {actionLabel ? (
                <button
                  onClick={handleAdvance}
                  disabled={advancing}
                  className="btn-orange w-full py-3.5 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {advancing ? 'Updating…' : actionLabel}
                </button>
              ) : order.status === 'delivered' ? (
                <div className="text-center py-2">
                  <span className="text-2xl">🎉</span>
                  <p className="text-sm font-semibold text-brand-dark mt-1">Order delivered!</p>
                </div>
              ) : (
                <div className="bg-amber-50 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-amber-700 font-medium">
                    Waiting for the scheduler to advance this step automatically…
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
