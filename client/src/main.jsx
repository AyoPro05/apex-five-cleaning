import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AnnouncementProvider } from './context/AnnouncementContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AnnouncementProvider>
          <App />
        </AnnouncementProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
