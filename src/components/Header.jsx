const TABS = [
  { id: 'map',     label: 'Live Map',    icon: '🗺️' },
  { id: 'order',   label: 'Place Order', icon: '➕' },
  { id: 'valet',   label: 'Valet View',  icon: '🚐' },
  { id: 'cleaner', label: 'Cleaner',     icon: '👕' },
]

export default function Header({ activeTab, onTabChange, activeOrders }) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-6"
      style={{ background: '#1e1f21', minHeight: '56px' }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-white font-bold text-xl tracking-tight">
          rinse
        </span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: '#cb6016', color: '#fff' }}
        >
          ops
        </span>
      </div>

      {/* ── Tabs ── */}
      <nav className="flex items-center gap-1">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150"
              style={
                active
                  ? { background: '#cb6016', color: '#fff' }
                  : { background: 'transparent', color: 'rgba(255,255,255,0.6)' }
              }
            >
              <span className="hidden sm:inline">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'map' && activeOrders > 0 && (
                <span
                  className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
                  style={{ background: active ? 'rgba(255,255,255,0.25)' : '#cb6016', color: '#fff', fontSize: 10 }}
                >
                  {activeOrders}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── Live indicator ── */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="live-dot" />
        <span className="text-xs font-medium hidden sm:block" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Live
        </span>
      </div>
    </header>
  )
}
