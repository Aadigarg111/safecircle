# SafeCircle 🛡️

> **Family Real-Time Location & Safety Platform with Geofencing, SOS and Women Safety Suite**

A production-quality, mobile-first PWA built with React + TypeScript + Vite. Works completely offline with zero setup in demo mode.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — log in as one of the demo users (click any quick-login button).

**Open multiple tabs** to simulate different family members moving in real time!

## 🏗️ Architecture

```
Browser (PWA)
│
├── React + TypeScript + Vite
├── Tailwind CSS + dark mode
├── React Router v6
├── Zustand (state)
│
├── Data Service Abstraction
│   ├── Demo Adapter (default)    ← localStorage + BroadcastChannel
│   └── Supabase Adapter          ← Real DB when env keys present
│
└── Map Stack (no API key required)
    ├── react-leaflet + OpenStreetMap
    ├── Overpass API (safe places)
    ├── OSRM (routing + ETA)
    ├── Nominatim (geocoding)
    └── leaflet.heat (risk heatmap)
```

## ✨ Features

### Core
- 🔐 **Auth** — Login/Signup with profile, avatar, emergency contacts
- 👥 **Circles** — Create/join family groups via 6-char invite code or QR
- 🗺️ **Live Map** — Real-time animated member markers with battery %, status, speed
- 🔔 **Alerts** — Filterable history with CSV + PDF export
- 🔋 **Battery Monitor** — Alert at < 15%, last known location when offline

### Geofencing
- ⭕ Draw circles and polygons as safe zones (Home, School, Work...)
- 📍 **Entry/Exit detection** using Haversine distance + ray-casting point-in-polygon
- 🔔 Instant browser notification on zone breach

### SOS System
- 🆘 **Hold-to-trigger** (3 seconds) with animated countdown ring
- 📳 **Shake-to-trigger** via DeviceMotion API
- 🎤 **Voice keyword** "help me" via Web Speech API
- 📢 Sound alarm + vibration + push notification to all circle members
- 📞 **WhatsApp/SMS** pre-filled with live location link
- ✅ Resolve SOS when safe

### Women Safety Suite
- 🚶 **Safe Journey Mode** — OSRM route + ETA, auto-alert if late/off-route
- 📞 **Fake Call** — Scheduled realistic incoming call (custom name + ringtone)
- 🔒 **Silent/Discreet SOS** — Calculator disguise, rapid-tap trigger
- 🎤 **Evidence Capture** — MediaRecorder audio + camera photo evidence
- 🗺️ **Safe Places Finder** — Overpass API (police, hospitals, pharmacies) + OSRM routing
- 🔥 **Risk Heatmap** — Community-reported unsafe spots with upvotes
- 🌙 **Night Check-ins** — 9 PM prompt, 2-min no-reply → auto SOS
- 📞 **Helpline Hub** — One-tap dial: 112, 1091, 181, 100, 1098

### Extra Features
- 📜 **Location History Replay** — Animated polyline of day's route
- 🔍 **Anomaly Detection** — Unusual stops, speed spikes
- ✅ **"I Reached Safely"** check-in
- 🔒 **Privacy Controls** — Pause sharing, ghost mode, auto-delete history
- 📊 **Admin Analytics** — Recharts: alerts/day, active members, geofence breaches
- 💬 **In-Circle Chat** — Real-time messages + quick replies
- 🌙 **Dark/Light Theme** — Persisted to localStorage
- 🇮🇳 **English + Hindi** i18n
- 👴 **Elder Mode** — Large UI, fall detection, daily I'm OK prompt
- 📱 **PWA Installable** — Service worker, offline fallback

## 📁 Project Structure

```
src/
├── types/          # TypeScript interfaces
├── services/
│   ├── data-service.ts     # Abstract interface
│   ├── demo-adapter.ts     # localStorage + BroadcastChannel
│   ├── supabase-adapter.ts # Supabase adapter
│   ├── index.ts            # Factory (picks adapter from env)
│   └── overpass.ts         # Overpass / OSRM / Nominatim APIs
├── store/          # Zustand global state
├── hooks/
│   ├── useGeolocation.ts   # watchPosition with fallback
│   ├── useBattery.ts       # Battery Status API
│   ├── useGeofence.ts      # Haversine + point-in-polygon monitor
│   ├── useShakeDetect.ts   # DeviceMotion shake
│   └── useNightCheckin.ts  # Scheduled night safety prompt
├── i18n/           # English + Hindi strings
├── components/
│   ├── map/        # MapView, markers, geofence, heatmap, route
│   ├── sos/        # SOSButton, FloatingSOS, SOSModal
│   ├── safety/     # Journey, FakeCall, Evidence, HelplineHub...
│   └── ui/         # BottomNav, Toast, Modal, Skeleton...
└── pages/          # MapPage, CirclePage, SOSPage, AlertsPage...
supabase/
└── schema.sql      # Full DB schema with RLS + indexes + seed
```

## 🗺️ Map Technology

All map services are **free and require no API keys**:

| Service | Purpose | Rate Limit |
|---------|---------|------------|
| OpenStreetMap | Base tiles | Fair use |
| Stadia Maps | Dark mode tiles | Free tier |
| Esri | Satellite tiles | Free tier |
| Overpass API | Safe places search | ~10k req/day |
| OSRM | Routing + ETA | Public instance |
| Nominatim | Geocoding/reverse | 1 req/sec |

## 🔒 Geofence Algorithm

```typescript
// Haversine distance between two coordinates (meters)
function haversineDistance(a, b) {
  const R = 6371000 // Earth radius in meters
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180
  const val = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2
  return R * 2 * Math.atan2(Math.sqrt(val), Math.sqrt(1 - val))
}

// Ray-casting point-in-polygon
function pointInPolygon(point, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat
    const xj = polygon[j].lng, yj = polygon[j].lat
    const intersect = yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}
```

Entry/exit is detected by comparing previous vs current state to **avoid duplicate alerts**.

## ⚡ Realtime (Demo Mode)

The Demo Adapter uses:
- **localStorage** for all data persistence
- **BroadcastChannel API** for cross-tab real-time sync
- **setInterval** to simulate GPS movement along predefined routes (New Delhi)
- Multiple browser tabs = multiple family members!

## 🔐 Supabase (Production Mode)

Add these to `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Run `supabase/schema.sql` in your project's SQL editor. Full RLS policies ensure users only see their own circles' data.

## 📱 PWA

- Installable on Android/iOS via browser "Add to Home Screen"
- Service worker caches OSM tiles for offline map viewing
- Offline fallback page

## 🎮 Demo Script

1. Open the app → click **"Priya (Admin)"** quick login
2. Open a second tab → log in as **"Rahul"**
3. Watch both members move on the map in real time
4. Tab 1: Hold the **SOS button** for 3 seconds — Tab 2 gets alerted!
5. Try **Fake Call** → schedule a call in 10 seconds
6. Enable **Night Mode** → wait for check-in prompt
7. Open **Alerts** → export as CSV or PDF
8. Switch to **Elder Mode** in Profile → try the simplified UI

## 🛠️ Build

```bash
npm run build    # TypeScript compile + Vite bundle
npm run preview  # Preview production build
```
