import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ORDERED_AREA_SLUGS, SERVICE_AREAS_BY_SLUG } from '../data/serviceAreasCatalog'

// Fix default marker icons (webpack/vite bundling)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
})

const getMapAreas = (singleAreaSlug) => {
  const slugs = singleAreaSlug ? [singleAreaSlug] : ORDERED_AREA_SLUGS

  return slugs
    .map((slug) => {
      const area = SERVICE_AREAS_BY_SLUG[slug]
      if (!area?.coordinates) return null
      return {
        slug,
        name: area.name,
        lat: area.coordinates.lat,
        lng: area.coordinates.lng,
      }
    })
    .filter(Boolean)
}

export default function ServiceAreaMap({ singleAreaSlug = null, height = '384px' }) {
  const mapRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    let map = null
    let markers = []
    let timerIds = []
    let resizeObserver
    let retries = 0

    const refreshMapSize = () => {
      if (!map) return
      window.requestAnimationFrame(() => {
        map?.invalidateSize({ pan: false })
      })
    }

    const init = () => {
      const el = mapRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if ((rect.height < 50 || rect.width < 50) && retries < 20) {
        retries++
        timerIds.push(setTimeout(init, 100))
        return
      }
      try {
        const validCoords = getMapAreas(singleAreaSlug)
        if (validCoords.length === 0) return

        const center = singleAreaSlug
          ? [validCoords[0].lat, validCoords[0].lng]
          : [51.27, 0.52]
        const zoom = singleAreaSlug ? 12 : 9

        map = L.map(el, {
          scrollWheelZoom: false,
          tap: true,
        }).setView(center, zoom)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map)

        validCoords.forEach(({ lat, lng, name, slug }) => {
          const marker = L.marker([lat, lng]).addTo(map)
          marker.bindPopup(`<strong>${name}</strong><br/><span class="text-teal-600">Click to view services</span>`)
          marker.on('click', () => navigate(`/service-areas/${slug}`))
          markers.push(marker)
        })

        if (!singleAreaSlug && validCoords.length > 1) {
          const group = L.featureGroup(markers)
          map.fitBounds(group.getBounds().pad(0.1))
        }

        if (window.ResizeObserver) {
          resizeObserver = new ResizeObserver(refreshMapSize)
          resizeObserver.observe(el)
        }
        window.addEventListener('resize', refreshMapSize)
        window.addEventListener('orientationchange', refreshMapSize)
        ;[100, 350, 800].forEach((delay) => {
          timerIds.push(setTimeout(refreshMapSize, delay))
        })
        map.whenReady(refreshMapSize)
        setReady(true)
      } catch (err) {
        console.error('Map load error:', err)
        setError(err.message)
      }
    }

    // Defer init so DOM is ready; extra delay for lazy-loaded pages
    const delay = singleAreaSlug ? 150 : 0
    timerIds.push(setTimeout(init, delay))
    return () => {
      timerIds.forEach(clearTimeout)
      resizeObserver?.disconnect?.()
      window.removeEventListener('resize', refreshMapSize)
      window.removeEventListener('orientationchange', refreshMapSize)
      markers.forEach(m => m?.remove?.())
      map?.remove?.()
    }
  }, [singleAreaSlug, navigate])

  if (error) {
    return (
      <div className="w-full rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center" style={{ height, minHeight: 200 }}>
        <p className="text-gray-500 text-sm">Map could not load. <a href="/service-areas" className="text-teal-600 underline">View service areas</a></p>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className="relative w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
      style={{ height: `clamp(320px, 68vh, ${height})`, minHeight: 280 }}
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      )}
    </div>
  )
}
