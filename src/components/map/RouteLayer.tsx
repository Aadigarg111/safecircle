import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

interface RouteLayerProps {
  points: [number, number][]
  color?: string
  animated?: boolean
}

export default function RouteLayer({ points, color = '#3b82f6', animated = false }: RouteLayerProps) {
  const map = useMap()
  const polylineRef = useRef<L.Polyline | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const indexRef = useRef(0)

  useEffect(() => {
    if (points.length < 2) return

    // Draw the full route
    polylineRef.current = L.polyline(points, {
      color,
      weight: 4,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map)

    // Fit bounds
    map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] })

    // Animated playback for history
    if (animated && points.length > 0) {
      const icon = L.divIcon({
        className: '',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
        html: `<div style="width:16px;height:16px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
      })
      markerRef.current = L.marker(points[0], { icon }).addTo(map)
      indexRef.current = 0

      const animate = () => {
        indexRef.current = (indexRef.current + 1) % points.length
        markerRef.current?.setLatLng(points[indexRef.current])
        animFrameRef.current = setTimeout(() => animate(), 100) as unknown as number
      }
      animFrameRef.current = setTimeout(() => animate(), 100) as unknown as number
    }

    return () => {
      if (polylineRef.current) map.removeLayer(polylineRef.current)
      if (markerRef.current) map.removeLayer(markerRef.current)
      if (animFrameRef.current) clearTimeout(animFrameRef.current)
    }
  }, [points, color, animated, map])

  return null
}
