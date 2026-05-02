import { useLocation, Routes, Route } from 'react-router-dom'
import { useTheme } from './context/ThemeContext.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { QueueInterceptor } from './components/QueueInterceptor.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import LandingHome from './pages/LandingHome.jsx'
import Home from './pages/Home.jsx'
import EventDetail from './pages/EventDetail.jsx'
import SeatMap from './pages/SeatMap.jsx'
import Checkout from './pages/Checkout.jsx'
import Tickets from './pages/Tickets.jsx'
import TicketDetail from './pages/TicketDetail.jsx'
import WaitingRoom from './pages/WaitingRoom.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminEvents from './pages/AdminEvents.jsx'
import AdminCreateEvent from './pages/AdminCreateEvent.jsx'
import Login from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Register from './pages/Register.jsx'
import NotFound from './pages/NotFound.jsx'
import Profile from './pages/Profile.jsx'
import Search from './pages/Search.jsx'

const AUTH_PATHS = ['/login', '/register', '/forgot-password']

function App() {
  const location = useLocation()
  const { isDark } = useTheme()
  const { user } = useAuth()

  const isAuthPage =
    AUTH_PATHS.includes(location.pathname) ||
    location.pathname.startsWith('/reset-password/')

  const showLayout = !isAuthPage && !!user

  return (
    <div className={`flex min-h-screen flex-col ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {showLayout && <Header />}

      <main className="grow">
        <QueueInterceptor>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<LandingHome />} />
            <Route path="/home" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/events/:eventId" element={<EventDetail />} />
            <Route path="/seat-map/:eventId" element={<SeatMap />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/tickets/:ticketId" element={<TicketDetail />} />
            <Route path="/waiting-room/:eventId" element={<WaitingRoom />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/events/create" element={<AdminCreateEvent />} />
            {/* <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} /> */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </QueueInterceptor>
      </main>

      {showLayout && <Footer />}
    </div>
  )
}

export default App