import { useState, useEffect, useCallback } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { reverseGeocode } from '../../api'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
const SF    = { longitude: -122.4194, latitude: 37.7749, zoom: 13 }

export default function LocationPicker({ value, onChange, onAddressUpdate }) {
  // Controlled viewport — lets us fly to address when autocomplete selects one
  const [viewState, setViewState] = useState(SF)

  // When parent updates value (e.g. from AddressSearch), fly the map there
  useEffect(() => {
    if (value) {
      setViewState((prev) => ({
        ...prev,
        longitude: value.lng,
        latitude:  value.lat,
        zoom:      15,
      }))
    }
  }, [value?.lat, value?.lng])

  const applyLocation = useCallback(async ({ lat, lng }) => {
    onChange({ lat, lng })
    if (onAddressUpdate) {
      const address = await reverseGeocode({ lat, lng })
      if (address) onAddressUpdate(address)
    }
  }, [onChange, onAddressUpdate])

  const handleClick   = useCallback((e) => applyLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng }), [applyLocation])
  const handleDragEnd = useCallback((e) => applyLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng }), [applyLocation])

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">
        Click the map or drag the pin · Auto-sets when you pick an address above
      </p>

      {/* Fixed height box — no stretching */}
      <div
        className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
        style={{ height: 260 }}
      >
        <Map
          mapboxAccessToken={TOKEN}
          {...viewState}
          onMove={(e) => setViewState(e.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onClick={handleClick}
          cursor="crosshair"
          scrollZoom={false}
        >
          <NavigationControl position="top-right" />

          {value && (
            <Marker
              longitude={value.lng}
              latitude={value.lat}
              anchor="center"
              draggable
              onDragEnd={handleDragEnd}
            >
              <div style={{
                width: 22, height: 22,
                borderRadius: '50%',
                background: '#cb6016',
                border: '3px solid #fff',
                boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
                cursor: 'grab',
              }} />
            </Marker>
          )}
        </Map>
      </div>

      <p className="text-xs mt-1.5" style={{ color: value ? '#9ca3af' : '#f59e0b' }}>
        {value ? `📍 ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : 'No location set — click the map or pick an address'}
      </p>
    </div>
  )
}
