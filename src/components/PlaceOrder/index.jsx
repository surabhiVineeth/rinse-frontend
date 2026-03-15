import { useState, useEffect } from 'react'
import { getItems, createOrder } from '../../api'
import ItemPicker from './ItemPicker'
import LocationPicker from './LocationPicker'
import AddressSearch from './AddressSearch'

const EMPTY_FORM = { customer_name: '', address: '' }

export default function PlaceOrder() {
  const [items,      setItems]      = useState([])
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [quantities, setQuantities] = useState({})   // { slug: qty }
  const [location,   setLocation]   = useState(null) // { lat, lng }
  const [loading,    setLoading]    = useState(false)
  const [success,    setSuccess]    = useState(null) // placed order object
  const [error,      setError]      = useState('')

  useEffect(() => {
    getItems().then((r) => setItems(r.data)).catch(console.error)
  }, [])

  const handleQtyChange = (slug, qty) =>
    setQuantities((prev) => ({ ...prev, [slug]: qty }))

  // Items selected with qty > 0
  const selectedItems = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([slug, quantity]) => ({ clothing_item_slug: slug, quantity }))

  // Running total
  const total = selectedItems.reduce((sum, { clothing_item_slug, quantity }) => {
    const item = items.find((i) => i.slug === clothing_item_slug)
    return sum + (item ? parseFloat(item.price) * quantity : 0)
  }, 0)

  const canSubmit =
    form.customer_name.trim() &&
    form.address.trim() &&
    location &&
    selectedItems.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const res = await createOrder({
        customer_name: form.customer_name.trim(),
        address:       form.address.trim(),
        latitude:      location.lat,
        longitude:     location.lng,
        items:         selectedItems,
      })
      setSuccess(res.data)
      // Reset form
      setForm(EMPTY_FORM)
      setQuantities({})
      setLocation(null)
    } catch (err) {
      const msg = err.response?.data?.items?.[0]
        ?? err.response?.data?.detail
        ?? 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-brand-dark mb-1">Order Placed!</h2>
          <p className="text-gray-500 text-sm mb-1">Order #{success.id}</p>
          <p className="text-gray-500 text-sm mb-6">
            Your valet will be dispatched shortly.
          </p>
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 text-left space-y-1">
            <p className="text-sm font-semibold text-brand-dark">{success.customer_name}</p>
            <p className="text-xs text-gray-500">{success.address}</p>
            <p className="text-xs font-medium mt-2" style={{ color: '#cb6016' }}>
              {success.item_count} item{success.item_count !== 1 ? 's' : ''} · ${parseFloat(success.total).toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="btn-teal w-full py-3 rounded-xl text-sm font-semibold"
          >
            Place Another Order
          </button>
        </div>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-brand-dark mb-1">Place an Order</h1>
        <p className="text-sm text-gray-500 mb-6">Fill in the details and select your items.</p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Left column: form + items ── */}
            <div className="space-y-5">

              {/* Customer info */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-sm font-semibold text-brand-dark mb-4">Customer Info</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={form.customer_name}
                      onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                      placeholder="Jane Doe"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-brand-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition"
                      style={{ '--tw-ring-color': '#cb6016' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Pickup Address</label>
                    <AddressSearch
                      value={form.address}
                      onChange={(text) => setForm((f) => ({ ...f, address: text }))}
                      onLocationSelect={({ lat, lng, address }) => {
                        setLocation({ lat, lng })
                        setForm((f) => ({ ...f, address }))
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Item picker */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-sm font-semibold text-brand-dark mb-4">Select Items</p>
                {items.length === 0 ? (
                  <p className="text-sm text-gray-400">Loading catalog…</p>
                ) : (
                  <ItemPicker
                    items={items}
                    quantities={quantities}
                    onQtyChange={handleQtyChange}
                  />
                )}
              </div>

              {/* Order summary + submit */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-brand-dark">Order Summary</p>
                  <p className="text-lg font-bold" style={{ color: '#cb6016' }}>
                    ${total.toFixed(2)}
                  </p>
                </div>

                {selectedItems.length === 0 ? (
                  <p className="text-xs text-gray-400 mb-4">No items selected yet.</p>
                ) : (
                  <ul className="space-y-1 mb-4">
                    {selectedItems.map(({ clothing_item_slug, quantity }) => {
                      const item = items.find((i) => i.slug === clothing_item_slug)
                      if (!item) return null
                      return (
                        <li key={clothing_item_slug} className="flex justify-between text-xs text-gray-600">
                          <span>{item.icon} {item.name} ×{quantity}</span>
                          <span>${(parseFloat(item.price) * quantity).toFixed(2)}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {error && (
                  <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="btn-orange w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Placing order…' : 'Place Order →'}
                </button>

                {!location && (
                  <p className="text-xs text-amber-500 mt-2 text-center">
                    Pin your location on the map →
                  </p>
                )}
              </div>
            </div>

            {/* ── Right column: map ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col" style={{ minHeight: 400 }}>
              <p className="text-sm font-semibold text-brand-dark mb-3">Pickup Location</p>
              <div className="flex-1">
                <LocationPicker
                  value={location}
                  onChange={setLocation}
                  onAddressUpdate={(address) => setForm((f) => ({ ...f, address }))}
                />
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
