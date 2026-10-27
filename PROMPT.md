Build a complete, production-quality, mobile-first web app called "SafeCircle - Family/Group Real-Time Location \& Safety Platform with Geofencing, SOS and Women Safety Suite".



TECH STACK

\- React + TypeScript (Vite), Tailwind CSS, React Router, Recharts

\- FREE MAPS, NO API KEY, NO ACCOUNT: Leaflet.js (react-leaflet) with OpenStreetMap tiles

&#x20; - Places search (police, hospitals, pharmacies): Overpass API (no key)

&#x20; - Routing and ETA: OSRM public server (no key)

&#x20; - Address search/reverse geocoding: Nominatim (no key, respect rate limit)

&#x20; - Heatmap: leaflet.heat. Geofence drawing: custom click/drag handlers or leaflet-draw.

&#x20; - Marker clustering: leaflet.markercluster

\- Backend: Supabase (Auth, PostgreSQL, Realtime, Storage, RLS) is OPTIONAL. Build a data-service abstraction with two adapters: (1) Supabase adapter, used when env keys exist; (2) Demo adapter (default when no keys), using localStorage + BroadcastChannel so multiple browser tabs act as different family members in real time, with seeded mock members moving along simulated routes. The app must run fully with zero setup via npm install \&\& npm run dev.

\- Browser APIs: Geolocation (watchPosition), Battery Status, Notifications, Vibration, MediaRecorder, Web Speech, DeviceMotion

\- PWA (installable, service worker, offline fallback)



MAP REQUIREMENTS

\- Custom Leaflet divIcon markers per member (avatar, name, battery %, status colour: green Safe / orange Outside zone / red SOS) with smooth animated movement

\- Geofences as L.circle and L.polygon; entry/exit detection using Haversine distance and point-in-polygon, comparing previous vs current state to avoid duplicate alerts

\- Safe Places Finder via Overpass (amenity=police, hospital, pharmacy) with one-tap routing via OSRM

\- Safe Journey: OSRM route, ETA, route-deviation detection (distance from polyline)

\- Risk heatmap from community-reported unsafe spots (leaflet.heat)

\- Layer toggles (street/satellite via free Esri/OSM tiles, dark theme tiles for night mode)

\- Location history replay: animated polyline of the day's route

\- Share link for live tracking using an OpenStreetMap link



CORE FEATURES

1\. Auth: signup/login, profile (name, phone, avatar, emergency contacts)

2\. Circles: create/join via invite code or QR; roles (Admin, Member, Child, Elder)

3\. Live map: real-time member markers with last-updated time, battery %, speed, accuracy, status

4\. Geofencing: custom safe zones (Home, School, Hostel...) with entry/exit events in an alert log

5\. SOS: big one-tap button with 3-second hold-to-confirm and shake-to-trigger; creates event with user, circle, location, timestamp; instant banner, sound, vibration and browser notification to all members

6\. Battery monitor: low-battery alert under 15%; show last known location when a device goes offline

7\. Alert history with filters and CSV/PDF export



WOMEN SAFETY SUITE

8\. Safe Journey Mode: destination and ETA; circle watches live; auto-alert if late or off-route

9\. Fake Call: scheduled realistic incoming-call screen with custom caller name and ringtone

10\. Silent/Discreet SOS: rapid-tap trigger, calculator-style disguise screen, voice keyword ("help me")

11\. Evidence Capture: on SOS, auto audio recording and periodic photo capture, stored and shared with trusted contacts

12\. Safe Places Finder with directions

13\. Safety Score and Heatmap: anonymous community reports (poor lighting, harassment, isolated area) with upvotes

14\. Night Mode Check-ins: after 9 PM prompt "Are you safe?"; no reply in 2 minutes triggers automatic SOS

15\. Helpline Hub: one-tap dial for 112, 1091, 181, 100, 1098; SOS can open pre-filled WhatsApp/SMS with live location link

16\. Trusted contacts outside the circle get SOS via SMS/WhatsApp link



EXTRA FEATURES

17\. Location history timeline with replay

18\. Anomaly detection: unusual stops, speed spikes, long inactivity

19\. "I reached safely" check-in

20\. Privacy controls: pause sharing, selected-member sharing, ghost mode, auto-delete history

21\. Admin analytics dashboard: alerts per day, active members, geofence breaches, SOS response time

22\. In-circle chat with quick replies

23\. Dark/light theme, English + Hindi, large accessible buttons

24\. Elder mode: simplified UI, fall detection via accelerometer, daily "I'm OK" prompt



DATABASE (Supabase, RLS so users only see their own circles' data)

Tables: profiles, circles, memberships, locations, geofences, geofence\_events, sos\_events, battery\_logs, trips, incident\_reports, evidence\_files, messages, notification\_logs, emergency\_contacts. Provide supabase/schema.sql with RLS policies, indexes and seed data.



UI/UX

Clean modern design, bottom navigation (Map, Circle, SOS, Alerts, Profile), floating red SOS button on every screen, skeleton loaders, toasts, responsive from 360px to desktop.



DELIVERABLES

\- Clear folder structure (components, pages, hooks, services, types), TypeScript interfaces for User, Circle, Location, Geofence, Alert, Trip, Incident

\- .env.example (Supabase keys optional), README with architecture diagram, feature list and demo script

\- Comments explaining geofence (Haversine, point-in-polygon) and realtime logic

\- Final check: run npm install, npm run build, fix all errors



Work in order: 1) scaffold + data-service abstraction + demo adapter, 2) auth + circles + live map, 3) geofence + SOS + battery, 4) women safety suite, 5) extras, 6) README. Verify the app runs after each stage.

EOF

