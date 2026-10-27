import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { dataService } from '@/services'

// Leaflet.heat is loaded as a script; we extend L
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace L {
    function heatLayer(latlngs: [number, number, number][], options?: Record<string, unknown>): L.Layer
  }
}

export default function HeatmapLayer() {
  const map = useMap()
  const layerRef = useRef<L.Layer | null>(null)

  useEffect(() => {
    const loadHeat = async () => {
      // Dynamically load leaflet.heat
      if (!L.heatLayer) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load leaflet.heat'))
          document.head.appendChild(script)
        })
      }

      const bounds = map.getBounds()
      const incidents = await dataService.getIncidents({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      })

      const points: [number, number, number][] = incidents.map(i => [
        i.location.lat,
        i.location.lng,
        Math.min(1, (i.upvotes + 1) / 10),
      ])

      if (layerRef.current) {
        map.removeLayer(layerRef.current)
      }

      if (points.length > 0 && L.heatLayer) {
        layerRef.current = L.heatLayer(points, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          gradient: { 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' },
        }).addTo(map)
      }
    }

    loadHeat().catch(console.error)

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
      }
    }
  }, [map])

  return null
}
