-- SafeCircle Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ── Tables ──────────────────────────────────────────────────────────────────

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar TEXT DEFAULT '👤',
  role TEXT DEFAULT 'Member' CHECK (role IN ('Admin', 'Member', 'Child', 'Elder')),
  emergency_contacts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circles (family/group)
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 6)),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle memberships
CREATE TABLE memberships (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'Member' CHECK (role IN ('Admin', 'Member', 'Child', 'Elder')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, circle_id)
);

-- Real-time locations (one row per user per circle)
CREATE TABLE locations (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy REAL,
  speed REAL,
  heading REAL,
  altitude REAL,
  battery_level SMALLINT DEFAULT 100,
  battery_charging BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'safe' CHECK (status IN ('safe', 'sos', 'outside_zone', 'offline', 'ghost')),
  is_sharing BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, circle_id)
);

-- Location history (all recorded points)
CREATE TABLE location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy REAL,
  speed REAL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Geofences
CREATE TABLE geofences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shape TEXT NOT NULL CHECK (shape IN ('circle', 'polygon')),
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  radius REAL,
  coordinates JSONB,
  color TEXT DEFAULT '#22c55e',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Geofence events (entry/exit)
CREATE TABLE geofence_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  geofence_id UUID REFERENCES geofences(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('entry', 'exit')),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT DEFAULT '',
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  geofence_id UUID REFERENCES geofences(id),
  geofence_name TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- SOS events
CREATE TABLE sos_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  trigger_type TEXT DEFAULT 'button' CHECK (trigger_type IN ('button', 'shake', 'silent', 'voice', 'night_checkin')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Battery logs
CREATE TABLE battery_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  level SMALLINT NOT NULL,
  charging BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Trips (Safe Journey)
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  start_lat DOUBLE PRECISION,
  start_lng DOUBLE PRECISION,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  eta TIMESTAMPTZ,
  eta_minutes INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue', 'cancelled')),
  route_polyline JSONB
);

-- Incident reports (community safety)
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('poor_lighting', 'harassment', 'isolated_area', 'unsafe_road', 'other')),
  description TEXT DEFAULT '',
  upvotes INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Evidence files
CREATE TABLE evidence_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sos_event_id UUID REFERENCES sos_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('audio', 'photo')),
  url TEXT NOT NULL,
  size INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_quick_reply BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Notification logs
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  target_user_ids UUID[],
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Privacy settings
CREATE TABLE privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_paused BOOLEAN DEFAULT FALSE,
  is_ghost_mode BOOLEAN DEFAULT FALSE,
  visible_to_members UUID[] DEFAULT '{}',
  auto_delete_after_days INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_circle ON memberships(circle_id);
CREATE INDEX idx_locations_circle ON locations(circle_id);
CREATE INDEX idx_location_history_user_time ON location_history(user_id, timestamp DESC);
CREATE INDEX idx_geofences_circle ON geofences(circle_id);
CREATE INDEX idx_alerts_circle_time ON alerts(circle_id, timestamp DESC);
CREATE INDEX idx_sos_circle ON sos_events(circle_id);
CREATE INDEX idx_messages_circle_time ON messages(circle_id, timestamp DESC);
CREATE INDEX idx_incidents_location ON incident_reports(lat, lng);
CREATE INDEX idx_trips_user ON trips(user_id, status);

-- ── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: users see own profile or profiles of members in same circles
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_read_circle_members" ON profiles FOR SELECT
  USING (id IN (
    SELECT user_id FROM memberships WHERE circle_id IN (
      SELECT circle_id FROM memberships WHERE user_id = auth.uid()
    )
  ));

-- Circles: members can read, admin can write
CREATE POLICY "circles_member_read" ON circles FOR SELECT
  USING (id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "circles_admin_write" ON circles FOR INSERT WITH CHECK (admin_id = auth.uid());
CREATE POLICY "circles_admin_update" ON circles FOR UPDATE USING (admin_id = auth.uid());

-- Memberships: see own circle members
CREATE POLICY "memberships_read" ON memberships FOR SELECT
  USING (circle_id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "memberships_insert_own" ON memberships FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "memberships_delete_own" ON memberships FOR DELETE USING (user_id = auth.uid());

-- Locations: see members of same circles
CREATE POLICY "locations_read" ON locations FOR SELECT
  USING (circle_id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "locations_write_own" ON locations FOR ALL USING (user_id = auth.uid());

-- Location history: own data only
CREATE POLICY "location_history_own" ON location_history FOR ALL USING (user_id = auth.uid());
CREATE POLICY "location_history_circle_read" ON location_history FOR SELECT
  USING (circle_id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid()));

-- Geofences: circle members can read
CREATE POLICY "geofences_read" ON geofences FOR SELECT
  USING (circle_id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "geofences_admin_write" ON geofences FOR INSERT
  WITH CHECK (circle_id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid() AND role = 'Admin'));
CREATE POLICY "geofences_admin_delete" ON geofences FOR DELETE
  USING (circle_id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid() AND role = 'Admin'));

-- Alerts: circle members
CREATE POLICY "alerts_read" ON alerts FOR SELECT
  USING (circle_id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "alerts_insert" ON alerts FOR INSERT
  WITH CHECK (circle_id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "alerts_update_read" ON alerts FOR UPDATE USING (
  circle_id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid())
);

-- SOS events: circle members
CREATE POLICY "sos_read" ON sos_events FOR SELECT
  USING (circle_id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "sos_insert" ON sos_events FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "sos_update_own" ON sos_events FOR UPDATE USING (user_id = auth.uid());

-- Trips: own + circle members can read
CREATE POLICY "trips_own" ON trips FOR ALL USING (user_id = auth.uid());
CREATE POLICY "trips_circle_read" ON trips FOR SELECT
  USING (circle_id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid()));

-- Incidents: everyone can read, authenticated can insert
CREATE POLICY "incidents_read" ON incident_reports FOR SELECT USING (true);
CREATE POLICY "incidents_insert" ON incident_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Messages: circle members
CREATE POLICY "messages_read" ON messages FOR SELECT
  USING (circle_id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (user_id = auth.uid() AND circle_id IN (SELECT circle_id FROM memberships WHERE user_id = auth.uid()));

-- Privacy settings: own only
CREATE POLICY "privacy_own" ON privacy_settings FOR ALL USING (user_id = auth.uid());

-- Battery logs: own
CREATE POLICY "battery_own" ON battery_logs FOR ALL USING (user_id = auth.uid());

-- Evidence: own
CREATE POLICY "evidence_own" ON evidence_files FOR ALL USING (user_id = auth.uid());

-- ── Functions ────────────────────────────────────────────────────────────────

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Increment upvote safely
CREATE OR REPLACE FUNCTION increment_upvote(incident_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE incident_reports SET upvotes = upvotes + 1 WHERE id = incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
