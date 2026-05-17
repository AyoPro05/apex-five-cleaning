import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './context/AuthContext'
import { AnnouncementProvider } from './context/AnnouncementContext'
import { CookieConsentProvider } from './context/CookieConsentContext'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <CookieConsentProvider>
            <AuthProvider>
              <AnnouncementProvider>
                <App />
              </AnnouncementProvider>
            </AuthProvider>
          </CookieConsentProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
