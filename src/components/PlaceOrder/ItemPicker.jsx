// Groups the catalog by category and renders a quantity stepper for each item.

const CATEGORY_ORDER = ['tops', 'bottoms', 'outerwear', 'formal', 'household']
const CATEGORY_LABEL = {
  tops:      'Tops',
  bottoms:   'Bottoms',
  outerwear: 'Outerwear',
  formal:    'Formal & Suits',
  household: 'Household',
}

export default function ItemPicker({ items, quantities, onQtyChange }) {
  // Group items by category
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const list = items.filter((i) => i.category === cat)
    if (list.length) acc[cat] = list
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            {CATEGORY_LABEL[cat]}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {list.map((item) => {
              const qty = quantities[item.slug] ?? 0
              return (
                <div
                  key={item.slug}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-150 ${
                    qty > 0
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  {/* Item info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl leading-none">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-dark truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">${parseFloat(item.price).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => onQtyChange(item.slug, Math.max(0, qty - 1))}
                      disabled={qty === 0}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: qty > 0 ? '#1e1f21' : '#e5e7eb', color: qty > 0 ? '#fff' : '#9ca3af' }}
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-semibold text-brand-dark">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onQtyChange(item.slug, Math.min(50, qty + 1))}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all"
                      style={{ background: '#cb6016' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
