export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div
      style={{
        position: 'fixed', top: 68, right: 16,
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderLeft: `4px solid ${COLORS[t.type]}`,
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            padding: '10px 14px',
            minWidth: 260, maxWidth: 320,
            animation: 'slideInRight 0.25s ease',
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1, marginTop: 1 }}>{t.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1e1f21' }}>{t.title}</p>
            {t.subtitle && (
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>{t.subtitle}</p>
            )}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#9ca3af', fontSize: 14, padding: 0, lineHeight: 1,
              marginTop: 1, flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

const COLORS = {
  info:    '#3b82f6',
  success: '#059669',
  warning: '#f59e0b',
  error:   '#ef4444',
  orange:  '#cb6016',
}
