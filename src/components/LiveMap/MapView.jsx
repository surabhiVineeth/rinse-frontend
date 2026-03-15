import { useState } from 'react'
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { STATUS_CONFIG, CLEANER_LOCATION } from '../../utils/statusConfig'

const TOKEN   = import.meta.env.VITE_MAPBOX_TOKEN
const SF      = { longitude: -122.4194, latitude: 37.7749 }
const MAP_STYLES = {
  streets:   'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  dark:      'mapbox://styles/mapbox/dark-v11',
}

// ── Pin helpers ──────────────────────────────────────────────────────────────
function OrderPin({ order, onClick }) {
  const cfg   = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.scheduled
  const color = cfg.color

  return (
    <Marker
      longitude={order.longitude}
      latitude={order.latitude}
      anchor="center"
      onClick={(e) => { e.originalEvent.stopPropagation(); onClick(order) }}
    >
      <div
        title={`${order.customer_name} — ${cfg.label}`}
        style={{
          width: 18, height: 18,
          borderRadius: '50%',
          background: color,
          border: '3px solid #fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
          cursor: 'pointer',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.4)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      />
    </Marker>
  )
}

function ValetPin({ valet }) {
  return (
    <Marker longitude={valet.longitude} latitude={valet.latitude} anchor="center">
      <div
        title={`${valet.name} — ${valet.status_display}`}
        style={{
          width: 14, height: 14,
          background: '#cb6016',
          border: '2px solid #fff',
          transform: 'rotate(45deg)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
      />
    </Marker>
  )
}

function CleanerPin() {
  return (
    <Marker
      longitude={CLEANER_LOCATION.longitude}
      latitude={CLEANER_LOCATION.latitude}
      anchor="center"
    >
      <div
        title={`${CLEANER_LOCATION.name}\n${CLEANER_LOCATION.address}`}
        style={{
          width: 28, height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(225deg, #00a3ad, #1d6076)',
          border: '3px solid #fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, cursor: 'default',
        }}
      >
        👕
      </div>
    </Marker>
  )
}

// ── Route layer ──────────────────────────────────────────────────────────────
function RouteLayer({ routeGeometry }) {
  if (!routeGeometry) return null
  const geojson = { type: 'Feature', geometry: routeGeometry }
  return (
    <Source id="route" type="geojson" data={geojson}>
      {/* Outline */}
      <Layer
        id="route-outline"
        type="line"
        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
        paint={{ 'line-color': '#fff', 'line-width': 6, 'line-opacity': 0.6 }}
      />
      {/* Main line */}
      <Layer
        id="route-line"
        type="line"
        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
        paint={{ 'line-color': '#cb6016', 'line-width': 3, 'line-dasharray': [1, 0] }}
      />
    </Source>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function MapView({ orders, valets, routeGeometry, onOrderClick }) {
  const [mapStyle, setMapStyle] = useState('streets')

  return (
    <div className="w-full h-full relative">
      <Map
        mapboxAccessToken={TOKEN}
        initialViewState={{ ...SF, zoom: 12 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLES[mapStyle]}
      >
        <NavigationControl position="top-right" />

        <RouteLayer routeGeometry={routeGeometry} />
        <CleanerPin />

        {orders.map((order) => (
          <OrderPin key={order.id} order={order} onClick={onOrderClick} />
        ))}

        {valets
          .filter((v) => v.status !== 'off_duty')
          .map((v) => <ValetPin key={`v-${v.id}`} valet={v} />)
        }
      </Map>

      {/* ── Map style toggle ── */}
      <div className="absolute top-3 left-3 z-10 flex gap-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-1">
        {Object.keys(MAP_STYLES).map((style) => (
          <button
            key={style}
            onClick={() => setMapStyle(style)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize"
            style={
              mapStyle === style
                ? { background: '#1e1f21', color: '#fff' }
                : { background: 'transparent', color: '#6b7280' }
            }
          >
            {style}
          </button>
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="absolute bottom-8 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2.5 hidden md:block">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Legend</p>
        <div className="space-y-1.5">
          {Object.entries(STATUS_CONFIG)
            .filter(([k]) => k !== 'cancelled')
            .map(([, cfg]) => (
              <div key={cfg.label} className="flex items-center gap-2">
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: cfg.color, border: '2px solid #fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
                <span className="text-xs text-gray-600">{cfg.label}</span>
              </div>
            ))}
          <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-gray-100">
            <div style={{ width: 10, height: 10, background: '#cb6016', border: '2px solid #fff', transform: 'rotate(45deg)' }} />
            <span className="text-xs text-gray-600">Valet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm leading-none">👕</span>
            <span className="text-xs text-gray-600">Cleaner</span>
          </div>
        </div>
      </div>
    </div>
  )
}
