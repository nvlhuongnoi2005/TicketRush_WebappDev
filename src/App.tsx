import { useLocation, Routes, Route } from 'react-router-dom'
import { QueueInterceptor } from './components/QueueInterceptor'
import { QueueDebugPanel } from './components/QueueDebugPanel'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import EventDetail from './pages/EventDetail'
import SeatMap from './pages/SeatMap'
import Checkout from './pages/Checkout'
import Tickets from './pages/Tickets'
import TicketDetail from './pages/TicketDetail'
import WaitingRoom from './pages/WaitingRoom'
import AdminDashboard from './pages/AdminDashboard'
import AdminEvents from './pages/AdminEvents'
import AdminCreateEvent from './pages/AdminCreateEvent'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

function App() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-white">
      <QueueDebugPanel />
      {!isAuthPage && <Header />}

      <main className="flex-grow-1">
        <QueueInterceptor>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events/:eventId" element={<EventDetail />} />
            <Route path="/seat-map/:eventId" element={<SeatMap />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/tickets/:ticketId" element={<TicketDetail />} />
            <Route path="/waiting-room/:eventId" element={<WaitingRoom />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/events/create" element={<AdminCreateEvent />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </QueueInterceptor>
      </main>

      {!isAuthPage && <Footer />}
    </div>
  )
}

export default App
