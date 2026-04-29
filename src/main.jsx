import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { QueueProvider } from './context/QueueContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { seedEventsIfNeeded } from './lib/eventStorage.js'

seedEventsIfNeeded()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <QueueProvider>
            <App />
          </QueueProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  </StrictMode>,
)
