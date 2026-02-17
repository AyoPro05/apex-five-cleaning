import { createContext, useContext, useState } from 'react'

const AnnouncementContext = createContext(null)

export function AnnouncementProvider({ children }) {
  const [visible, setVisible] = useState(false)
  return (
    <AnnouncementContext.Provider value={{ visible, setVisible }}>
      {children}
    </AnnouncementContext.Provider>
  )
}

export function useAnnouncement() {
  const ctx = useContext(AnnouncementContext)
  return ctx || { visible: false, setVisible: () => {} }
}
