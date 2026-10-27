import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { SafePlace } from '@/types'

interface SafePlacesLayerProps {
  places: SafePlace[]
}

const TYPE_ICONS: Record<string, string> = {
  police: '🚔',
  hospital: '🏥',
  pharmacy: '💊',
}

const TYPE_COLORS: Record<string, string> = {
  police: '#3b82f6',
  hospital: '#ef4444',
  pharmacy: '#22c55e',
}

export default function SafePlacesLayer({ places }: SafePlacesLayerProps) {
  const map = useMap()
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    // Clear existing
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    places.forEach(place => {
      const color = TYPE_COLORS[place.type] ?? '#64748b'
      const emoji = TYPE_ICONS[place.type] ?? '📍'

      const icon = L.divIcon({
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        html: `
          <div style="
            width:40px; height:40px; border-radius:50%;
            background:${color}; color:white;
            display:flex; align-items:center; justify-content:center;
            font-size:18px; box-shadow:0 2px 8px rgba(0,0,0,0.3);
            border:3px solid white;
          ">${emoji}</div>
        `,
      })

      const marker = L.marker([place.location.lat, place.location.lng], { icon })
        .bindPopup(`
          <div style="font-family:Inter,sans-serif; min-width:140px;">
            <div style="font-weight:700; margin-bottom:4px;">${emoji} ${place.name}</div>
            ${place.address ? `<div style="font-size:12px; color:#64748b; margin-bottom:4px;">${place.address}</div>` : ''}
            ${place.distance !== undefined ? `<div style="font-size:12px; color:#64748b;">${(place.distance / 1000).toFixed(1)} km away</div>` : ''}
            ${place.etaMinutes !== undefined ? `<div style="font-size:12px; color:#22c55e; font-weight:600;">~${place.etaMinutes} min</div>` : ''}
          </div>
        `)
        .addTo(map)

      markersRef.current.push(marker)
    })
  }, [places, map])

  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []
    }
  }, [map])

  return null
}
