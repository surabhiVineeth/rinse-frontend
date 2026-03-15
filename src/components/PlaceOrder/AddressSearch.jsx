import { useState, useRef, useEffect } from 'react'
import { geocodeAddress } from '../../api'

// SF bounding box for validation (lat/lng min/max)
const SF_BOUNDS = { minLat: 37.7034, maxLat: 37.8324, minLng: -122.5274, maxLng: -122.3482 }

function isInSF({ lat, lng }) {
  return (
    lat >= SF_BOUNDS.minLat && lat <= SF_BOUNDS.maxLat &&
    lng >= SF_BOUNDS.minLng && lng <= SF_BOUNDS.maxLng
  )
}

export default function AddressSearch({ value, onChange, onLocationSelect }) {
  const [suggestions, setSuggestions] = useState([])
  const [open,        setOpen]        = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [sfError,     setSFError]     = useState('')
  const debounceRef   = useRef(null)
  const wrapperRef    = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (text) => {
    onChange(text)
    setSFError('')
    clearTimeout(debounceRef.current)
    if (text.length < 3) { setSuggestions([]); setOpen(false); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      const results = await geocodeAddress(text)
      setSuggestions(results)
      setOpen(results.length > 0)
      setLoading(false)
    }, 300)
  }

  const handleSelect = (feature) => {
    const [lng, lat] = feature.center
    setOpen(false)
    setSuggestions([])

    if (!isInSF({ lat, lng })) {
      setSFError('Sorry, we only operate within San Francisco.')
      onChange(feature.place_name)
      return
    }

    onChange(feature.place_name)
    onLocationSelect({ lat, lng, address: feature.place_name })
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="123 Market St, San Francisco"
          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-brand-dark placeholder-gray-300 focus:outline-none focus:ring-2 focus:border-transparent transition pr-8"
          style={{ '--tw-ring-color': '#cb6016' }}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {sfError && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <span>📍</span> {sfError}
        </p>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {suggestions.map((feat) => (
            <li key={feat.id}>
              <button
                type="button"
                onClick={() => handleSelect(feat)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm text-brand-dark truncate">{feat.place_name}</p>
              </button>
            </li>
          ))}
          <li className="px-4 py-1.5 border-t border-gray-100">
            <p className="text-xs text-gray-400">SF only · Powered by Mapbox</p>
          </li>
        </ul>
      )}
    </div>
  )
}
