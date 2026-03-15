import { useState } from 'react'
import Header from './components/Header'
import LiveMap from './components/LiveMap'
import PlaceOrder from './components/PlaceOrder'
import ValetView from './components/ValetView'

export default function App() {
  const [activeTab,    setActiveTab]    = useState('map')
  const [activeOrders, setActiveOrders] = useState(0)

  return (
    <div className="flex flex-col h-full">
      <Header activeTab={activeTab} onTabChange={setActiveTab} activeOrders={activeOrders} />

      <main className="flex-1 overflow-hidden">
        <div className={activeTab === 'map'   ? 'h-full' : 'hidden'}>
          <LiveMap onOrderCountChange={setActiveOrders} />
        </div>
        <div className={activeTab === 'order' ? 'h-full' : 'hidden'}><PlaceOrder /></div>
        <div className={activeTab === 'valet' ? 'h-full' : 'hidden'}><ValetView /></div>
      </main>
    </div>
  )
}
