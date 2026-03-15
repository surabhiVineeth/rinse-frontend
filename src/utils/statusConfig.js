// Single source of truth for order status metadata.
// Used by: map pins, sidebar chips, timeline stepper, valet view.

export const STATUS_CONFIG = {
  scheduled:  { label: 'Scheduled',           color: '#6b7280', bgLight: '#f3f4f6', step: 0 },
  dispatched: { label: 'Dispatched',          color: '#3b82f6', bgLight: '#eff6ff', step: 1 },
  picked_up:  { label: 'Picked Up',           color: '#7c3aed', bgLight: '#f5f3ff', step: 2 },
  at_cleaner: { label: 'At Cleaner',          color: '#d97706', bgLight: '#fffbeb', step: 3 },
  ready:      { label: 'Ready for Delivery',  color: '#059669', bgLight: '#ecfdf5', step: 4 },
  delivered:  { label: 'Delivered',           color: '#1e1f21', bgLight: '#f9fafb', step: 5 },
  cancelled:  { label: 'Cancelled',           color: '#dc2626', bgLight: '#fef2f2', step: -1 },
}

// Fixed cleaner location in SoMa, SF — shown as a special pin on the map
export const CLEANER_LOCATION = {
  latitude:  37.7751,
  longitude: -122.4068,
  name:      'Rinse Cleaning Partner',
  address:   '340 Brannan St, San Francisco',
}

// Ordered list used by the progress stepper
export const STATUS_ORDER = [
  'scheduled',
  'dispatched',
  'picked_up',
  'at_cleaner',
  'ready',
  'delivered',
]

// Valet action button label for each actionable status
export const VALET_ACTION_LABEL = {
  dispatched: 'Confirm Pickup',
  picked_up:  'Drop at Cleaner',
  ready:      'Confirm Delivery',
}
