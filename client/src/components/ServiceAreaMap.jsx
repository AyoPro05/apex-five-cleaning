import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons (webpack/vite bundling)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
})

const AREA_COORDINATES = {
  canterbury: { lat: 51.2793, lng: 1.0832, name: 'Canterbury' },
  dover: { lat: 51.1289, lng: 1.3127, name: 'Dover' },
  maidstone: { lat: 51.2707, lng: 0.5197, name: 'Maidstone' },
  'tunbridge-wells': { lat: 51.1829, lng: 0.274, name: 'Tunbridge Wells' },
  sevenoaks: { lat: 51.1544, lng: 0.1759, name: 'Sevenoaks' },
  ashford: { lat: 51.1447, lng: 0.8738, name: 'Ashford' },
  sheerness: { lat: 51.4421, lng: 0.7491, name: "Sheerness-on-Sea" },
  sittingbourne: { lat: 51.3462, lng: 0.7417, name: 'Sittingbourne' },
  axminster: { lat: 51.3789, lng: 0.9147, name: 'Axminster' },
  'minster-on-sea': { lat: 51.4176, lng: 0.8447, name: 'Minster-on-Sea' },
  croydon: { lat: 51.3758, lng: -0.1045, name: 'Croydon' }
}

const SLUG_BY_NAME = {
  'Canterbury': 'canterbury',
  'Dover': 'dover',
  'Maidstone': 'maidstone',
  'Tunbridge Wells': 'tunbridge-wells',
  'Sevenoaks': 'sevenoaks',
  'Ashford': 'ashford',
  "Sheerness-on-Sea": 'sheerness',
  'Sittingbourne': 'sittingbourne',
  'Axminster': 'axminster',
  'Minster-on-Sea': 'minster-on-sea',
  'Croydon': 'croydon'
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
    let timerId
    let retries = 0

    const init = () => {
      const el = mapRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if ((rect.height < 50 || rect.width < 50) && retries < 20) {
        retries++
        timerId = setTimeout(init, 100)
        return
      }
      try {
        const coords = singleAreaSlug
          ? [AREA_COORDINATES[singleAreaSlug]]
          : Object.entries(AREA_COORDINATES).map(([slug, data]) => ({ ...data, slug }))

        const validCoords = coords.filter(Boolean)
        if (validCoords.length === 0) return

        const center = singleAreaSlug
          ? [validCoords[0].lat, validCoords[0].lng]
          : [51.27, 0.52]
        const zoom = singleAreaSlug ? 12 : 9

        map = L.map(el).setView(center, zoom)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map)

        validCoords.forEach(({ lat, lng, name, slug }) => {
          const areaSlug = slug || singleAreaSlug || SLUG_BY_NAME[name]
          const marker = L.marker([lat, lng]).addTo(map)
          marker.bindPopup(`<strong>${name}</strong><br/><span class="text-teal-600">Click to view services</span>`)
          marker.on('click', () => navigate(`/service-areas/${areaSlug}`))
          markers.push(marker)
        })

        if (!singleAreaSlug && validCoords.length > 1) {
          const group = L.featureGroup(markers)
          map.fitBounds(group.getBounds().pad(0.1))
        }

        setTimeout(() => map?.invalidateSize(), 100)
        setReady(true)
      } catch (err) {
        console.error('Map load error:', err)
        setError(err.message)
      }
    }

    // Defer init so DOM is ready; extra delay for lazy-loaded pages
    const delay = singleAreaSlug ? 150 : 0
    timerId = setTimeout(init, delay)
    return () => {
      clearTimeout(timerId)
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
      style={{ height, minHeight: 200 }}
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      )}
    </div>
  )
}
