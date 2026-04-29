import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { QueueProvider } from './context/QueueContext'
import { seedEventsIfNeeded } from './lib/eventStorage.js'

seedEventsIfNeeded()

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <QueueProvider>
          <App />
        </QueueProvider>
      </AuthProvider>
    </Router>
  </StrictMode>,
)
