import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useStore } from '@/store'
import type { Geofence } from '@/types'

export default function GeofenceLayer() {
  const map = useMap()
  const geofences = useStore(s => s.geofences)
  const layersRef = useRef<Map<string, L.Layer>>(new Map())

  useEffect(() => {
    const existingIds = new Set<string>()

    geofences.forEach(gf => {
      existingIds.add(gf.id)

      if (layersRef.current.has(gf.id)) return // Already drawn

      const opts: L.PathOptions = {
        color: gf.color,
        fillColor: gf.color,
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '8 4',
      }

      let layer: L.Layer

      if (gf.shape === 'circle' && gf.center && gf.radius) {
        layer = L.circle([gf.center.lat, gf.center.lng], {
          ...opts,
          radius: gf.radius,
        }).bindPopup(`<strong>${gf.name}</strong><br/>Radius: ${gf.radius}m`)
      } else if (gf.shape === 'polygon' && gf.coordinates && gf.coordinates.length > 0) {
        layer = L.polygon(
          gf.coordinates.map(c => [c.lat, c.lng] as [number, number]),
          opts,
        ).bindPopup(`<strong>${gf.name}</strong>`)
      } else {
        return
      }

      layer.addTo(map)
      layersRef.current.set(gf.id, layer)
    })

    // Remove deleted geofences
    layersRef.current.forEach((layer, id) => {
      if (!existingIds.has(id)) {
        map.removeLayer(layer)
        layersRef.current.delete(id)
      }
    })
  }, [geofences, map])

  useEffect(() => {
    return () => {
      layersRef.current.forEach(l => map.removeLayer(l))
      layersRef.current.clear()
    }
  }, [map])

  return null
}
