import { useState } from 'react'
import { cancelOrder } from '../../api'
import { STATUS_CONFIG, STATUS_ORDER, CLEANER_LOCATION } from '../../utils/statusConfig'

function fmt(ts) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function fmtETA(seconds) {
  if (!seconds) return null
  const mins = Math.round(seconds / 60)
  return mins < 60 ? `~${mins} min` : `~${Math.round(mins / 60)}h ${mins % 60}m`
}

const ROUTE_LABEL = {
  dispatched: 'ETA to pickup',
  picked_up:  'ETA to cleaner',
  ready:      'ETA to delivery',
}

export default function TimelineDrawer({ order, routeETA, onClose, onOrderUpdated }) {
  const [cancelling,   setCancelling]   = useState(false)
  const [cancelError,  setCancelError]  = useState('')
  const [cancelDone,   setCancelDone]   = useState(false)

  if (!order) return null

  const currentStep   = STATUS_ORDER.indexOf(order.status)
  const isCancelled   = order.status === 'cancelled'
  const canCancel     = order.status === 'scheduled'
  const etaLabel      = ROUTE_LABEL[order.status]

  const handleCancel = async () => {
    setCancelling(true)
    setCancelError('')
    try {
      await cancelOrder(order.id)
      setCancelDone(true)
      onOrderUpdated?.()
    } catch (err) {
      setCancelError(err.response?.data?.error ?? 'Could not cancel order.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      {/* Backdrop (mobile) */}
      <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={onClose} />

      {/* Drawer panel */}
      <div className={[
        'fixed z-40 bg-white shadow-2xl overflow-y-auto',
        'md:top-14 md:right-0 md:bottom-0 md:w-96 md:animate-slide-in-right md:rounded-l-2xl',
        'bottom-0 left-0 right-0 max-h-[88vh] rounded-t-2xl animate-slide-in-up md:max-h-full md:rounded-t-none md:left-auto',
      ].join(' ')}>

        {/* ── Header ── */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between z-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-0.5">
              Order #{order.id}
            </p>
            <h2 className="text-base font-bold text-brand-dark leading-snug">{order.customer_name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{order.address}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 mt-0.5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 text-lg shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">

          {/* ── Status + valet + ETA ── */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full status-${order.status}`}>
              {STATUS_CONFIG[order.status]?.label ?? order.status}
            </span>
            {routeETA && etaLabel && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full ml-auto"
                style={{ background: '#ecfdf5', color: '#059669' }}>
                {etaLabel}: {fmtETA(routeETA)}
              </span>
            )}
          </div>

          {/* ── Assigned valet card ──
               The valet changes mid-journey:
               - dispatched / picked_up  → pickup valet  (on their way to customer)
               - ready / delivered       → delivery valet (on their way back to customer)
               We label this clearly so it never conflicts with historical notes.
          ── */}
          {order.assigned_valet && (
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-gray-100"
                 style={{ background: '#f9fafb' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                   style={{ background: '#1e1f21' }}>
                {order.assigned_valet.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-dark">{order.assigned_valet.name}</p>
                <p className="text-xs text-gray-400">{order.assigned_valet.status_display}</p>
              </div>
              <span className="text-xs font-semibold ml-auto shrink-0 px-2 py-0.5 rounded-full"
                style={{ background: '#eff6ff', color: '#3b82f6' }}>
                {['dispatched', 'picked_up'].includes(order.status) ? 'Pickup valet' : 'Delivery valet'}
              </span>
            </div>
          )}

          {/* ── Cleaner info (shown when relevant) ── */}
          {['picked_up', 'at_cleaner', 'ready'].includes(order.status) && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
              <span className="text-xl">👕</span>
              <div>
                <p className="text-xs font-semibold text-brand-dark">{CLEANER_LOCATION.name}</p>
                <p className="text-xs text-gray-400">{CLEANER_LOCATION.address}</p>
              </div>
            </div>
          )}

          {/* ── Items ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-brand-dark">Items</p>
              <p className="text-sm font-bold" style={{ color: '#cb6016' }}>
                ${parseFloat(order.total).toFixed(2)}
              </p>
            </div>
            <div className="space-y-1.5">
              {order.order_items?.map((oi) => (
                <div key={oi.id} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{oi.clothing_item.icon}</span>
                    <span className="text-sm text-gray-700">
                      {oi.clothing_item.name}
                      <span className="text-gray-400 ml-1">×{oi.quantity}</span>
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    ${parseFloat(oi.subtotal).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Timeline stepper ── */}
          {!isCancelled && (
            <div>
              <p className="text-sm font-semibold text-brand-dark mb-3">Timeline</p>
              <div>
                {STATUS_ORDER.map((status, idx) => {
                  const done    = idx <= currentStep
                  const current = idx === currentStep
                  const cfg     = STATUS_CONFIG[status]
                  const hist    = order.history?.find((h) => h.status === status)
                  const isLast  = idx === STATUS_ORDER.length - 1
                  return (
                    <div key={status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-3 h-3 rounded-full border-2 shrink-0 mt-1"
                          style={{
                            background:  done ? cfg.color : '#fff',
                            borderColor: done ? cfg.color : '#d1d5db',
                            boxShadow:   current ? `0 0 0 3px ${cfg.color}33` : 'none',
                          }}
                        />
                        {!isLast && (
                          <div className="w-0.5 flex-1 my-1"
                            style={{ background: done && idx < currentStep ? cfg.color : '#e5e7eb' }} />
                        )}
                      </div>
                      <div className="pb-4 min-w-0">
                        <p className="text-sm font-medium leading-none"
                          style={{ color: done ? '#1e1f21' : '#9ca3af' }}>
                          {cfg.label}
                          {/* Show cleaner address on at_cleaner step */}
                          {status === 'at_cleaner' && (
                            <span className="text-xs text-gray-400 ml-1 font-normal">
                              · {CLEANER_LOCATION.address}
                            </span>
                          )}
                        </p>
                        {hist && (
                          <>
                            <p className="text-xs text-gray-400 mt-0.5">{fmt(hist.timestamp)}</p>
                            {hist.note && <p className="text-xs text-gray-500 mt-0.5">{hist.note}</p>}
                          </>
                        )}
                        {current && routeETA && etaLabel && !hist?.timestamp && (
                          <p className="text-xs font-medium mt-0.5" style={{ color: '#059669' }}>
                            {fmtETA(routeETA)} away
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Cancelled state ── */}
          {isCancelled && (
            <div className="bg-red-50 rounded-xl px-4 py-3 text-center">
              <span className="text-2xl">❌</span>
              <p className="text-sm font-semibold text-red-600 mt-1">Order Cancelled</p>
              {order.history?.find((h) => h.status === 'cancelled') && (
                <p className="text-xs text-red-400 mt-0.5">
                  {fmt(order.history.find((h) => h.status === 'cancelled').timestamp)}
                </p>
              )}
            </div>
          )}

          {/* ── Cancel button ── */}
          {canCancel && !cancelDone && (
            <div>
              {cancelError && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-2">{cancelError}</p>
              )}
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-2.5 rounded-xl text-sm font-semibold border-2 transition-all disabled:opacity-40"
                style={{ borderColor: '#dc2626', color: '#dc2626' }}
              >
                {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
