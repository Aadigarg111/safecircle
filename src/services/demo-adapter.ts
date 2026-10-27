import type {
  User, Circle, Membership, MemberLocation, Geofence, Alert,
  SOSEvent, Trip, IncidentReport, Message,
  PrivacySettings, AdminAnalytics, LocationPoint, TripStatus
} from '@/types';
import type { DataService } from './data-service';

// ── helpers ────────────────────────────────────────────────────────────────
function uuid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}
function now(): string { return new Date().toISOString(); }
function ls<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; }
}
function lsSet(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── seeded mock data ────────────────────────────────────────────────────────
const DEMO_CIRCLE_ID = 'demo-circle-1';
const DEMO_CIRCLE_INVITE = 'SAFE2024';

// New Delhi area routes for simulated movement
const ROUTES: Record<string, LocationPoint[]> = {
  'user-priya': [
    { lat: 28.6139, lng: 77.2090, timestamp: now() },
    { lat: 28.6145, lng: 77.2095, timestamp: now() },
    { lat: 28.6152, lng: 77.2100, timestamp: now() },
    { lat: 28.6158, lng: 77.2108, timestamp: now() },
    { lat: 28.6163, lng: 77.2115, timestamp: now() },
    { lat: 28.6155, lng: 77.2120, timestamp: now() },
    { lat: 28.6148, lng: 77.2112, timestamp: now() },
    { lat: 28.6141, lng: 77.2098, timestamp: now() },
  ],
  'user-rahul': [
    { lat: 28.6200, lng: 77.2150, timestamp: now() },
    { lat: 28.6210, lng: 77.2160, timestamp: now() },
    { lat: 28.6220, lng: 77.2155, timestamp: now() },
    { lat: 28.6215, lng: 77.2145, timestamp: now() },
    { lat: 28.6205, lng: 77.2140, timestamp: now() },
    { lat: 28.6198, lng: 77.2148, timestamp: now() },
  ],
  'user-anita': [
    { lat: 28.6080, lng: 77.2050, timestamp: now() },
    { lat: 28.6085, lng: 77.2055, timestamp: now() },
    { lat: 28.6082, lng: 77.2060, timestamp: now() },
    { lat: 28.6078, lng: 77.2058, timestamp: now() },
  ],
  'user-rohan': [
    { lat: 28.6300, lng: 77.2200, timestamp: now() },
    { lat: 28.6310, lng: 77.2210, timestamp: now() },
    { lat: 28.6320, lng: 77.2205, timestamp: now() },
    { lat: 28.6315, lng: 77.2195, timestamp: now() },
    { lat: 28.6305, lng: 77.2190, timestamp: now() },
  ],
};

const SEED_USERS: User[] = [
  {
    id: 'user-priya',
    name: 'Priya Sharma',
    email: 'priya@demo.com',
    phone: '+91 98765 43210',
    avatar: '👩',
    role: 'Admin',
    emergencyContacts: [
      { id: 'ec-1', name: 'Rahul Sharma', phone: '+91 98765 43211', relation: 'Husband' },
      { id: 'ec-2', name: 'Anita Sharma', phone: '+91 98765 43212', relation: 'Mother-in-law' },
    ],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-rahul',
    name: 'Rahul Sharma',
    email: 'rahul@demo.com',
    phone: '+91 98765 43211',
    avatar: '👨',
    role: 'Member',
    emergencyContacts: [],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-anita',
    name: 'Anita Sharma',
    email: 'anita@demo.com',
    phone: '+91 98765 43212',
    avatar: '👴',
    role: 'Elder',
    emergencyContacts: [],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-rohan',
    name: 'Rohan Sharma',
    email: 'rohan@demo.com',
    phone: '+91 98765 43213',
    avatar: '👦',
    role: 'Child',
    emergencyContacts: [],
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const SEED_CIRCLE: Circle = {
  id: DEMO_CIRCLE_ID,
  name: 'Sharma Family',
  inviteCode: DEMO_CIRCLE_INVITE,
  adminId: 'user-priya',
  createdAt: '2024-01-01T00:00:00Z',
  memberCount: 4,
};

const SEED_MEMBERSHIPS: Membership[] = SEED_USERS.map(u => ({
  userId: u.id,
  circleId: DEMO_CIRCLE_ID,
  role: u.role,
  joinedAt: '2024-01-01T00:00:00Z',
}));

const SEED_GEOFENCES: Geofence[] = [
  {
    id: 'gf-home',
    circleId: DEMO_CIRCLE_ID,
    name: 'Home',
    shape: 'circle',
    center: { lat: 28.6139, lng: 77.2090 },
    radius: 300,
    color: '#22c55e',
    createdBy: 'user-priya',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'gf-school',
    circleId: DEMO_CIRCLE_ID,
    name: 'School',
    shape: 'polygon',
    coordinates: [
      { lat: 28.6295, lng: 77.2185 },
      { lat: 28.6325, lng: 77.2185 },
      { lat: 28.6325, lng: 77.2215 },
      { lat: 28.6295, lng: 77.2215 },
    ],
    color: '#3b82f6',
    createdBy: 'user-priya',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

function seedAlerts(): Alert[] {
  return [
    {
      id: uuid(), type: 'geofence_entry', userId: 'user-rohan', userName: 'Rohan Sharma',
      circleId: DEMO_CIRCLE_ID, message: 'Rohan arrived at School', geofenceId: 'gf-school',
      geofenceName: 'School', timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true, severity: 'info',
    },
    {
      id: uuid(), type: 'battery_low', userId: 'user-anita', userName: 'Anita Sharma',
      circleId: DEMO_CIRCLE_ID, message: "Anita's battery is at 12%",
      timestamp: new Date(Date.now() - 7200000).toISOString(), read: false, severity: 'warning',
    },
    {
      id: uuid(), type: 'sos', userId: 'user-priya', userName: 'Priya Sharma',
      circleId: DEMO_CIRCLE_ID, message: 'Priya triggered SOS!',
      location: { lat: 28.6139, lng: 77.2090, timestamp: new Date(Date.now() - 86400000).toISOString() },
      timestamp: new Date(Date.now() - 86400000).toISOString(), read: true, severity: 'critical',
    },
  ];
}

function seedIncidents(): IncidentReport[] {
  return [
    {
      id: uuid(), userId: 'user-priya',
      location: { lat: 28.6180, lng: 77.2130, timestamp: now() },
      category: 'poor_lighting', description: 'Very dark alley near market',
      timestamp: new Date(Date.now() - 86400000).toISOString(), upvotes: 5,
    },
    {
      id: uuid(), userId: 'user-rahul',
      location: { lat: 28.6220, lng: 77.2160, timestamp: now() },
      category: 'harassment', description: 'Street harassment reported near bus stop',
      timestamp: new Date(Date.now() - 172800000).toISOString(), upvotes: 12,
    },
    {
      id: uuid(), userId: 'user-priya',
      location: { lat: 28.6100, lng: 77.2070, timestamp: now() },
      category: 'isolated_area', description: 'Deserted park after 8pm',
      timestamp: new Date(Date.now() - 259200000).toISOString(), upvotes: 3,
    },
  ];
}

function seedMessages(): Message[] {
  return [
    {
      id: uuid(), circleId: DEMO_CIRCLE_ID, userId: 'user-priya',
      userName: 'Priya Sharma', userAvatar: '👩',
      content: 'Hey everyone! I set up our family SafeCircle 🎉',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: uuid(), circleId: DEMO_CIRCLE_ID, userId: 'user-rahul',
      userName: 'Rahul Sharma', userAvatar: '👨',
      content: '👍 Great! I can see everyone on the map.',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      id: uuid(), circleId: DEMO_CIRCLE_ID, userId: 'user-rohan',
      userName: 'Rohan Sharma', userAvatar: '👦',
      content: 'I reached school safely!', isQuickReply: true,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
  ];
}

// ── route indices for smooth movement ───────────────────────────────────────
const routeIndices: Record<string, number> = {};
SEED_USERS.forEach(u => { routeIndices[u.id] = 0; });

// ── broadcast helpers ────────────────────────────────────────────────────────
const BC_NAME = 'safecircle';
type BCMessage =
  | { type: 'location'; payload: MemberLocation }
  | { type: 'alert'; payload: Alert }
  | { type: 'message'; payload: Message }
  | { type: 'sos'; payload: SOSEvent };

function broadcast(msg: BCMessage): void {
  try {
    const bc = new BroadcastChannel(BC_NAME);
    bc.postMessage(msg);
    bc.close();
  } catch {/* safari private mode */}
}

// ── init localStorage ────────────────────────────────────────────────────────
function ensureSeeded(): void {
  if (ls<boolean>('sc_seeded', false)) return;
  lsSet('sc_users', SEED_USERS);
  lsSet('sc_circles', [SEED_CIRCLE]);
  lsSet('sc_memberships', SEED_MEMBERSHIPS);
  lsSet('sc_geofences', SEED_GEOFENCES);
  lsSet('sc_alerts', seedAlerts());
  lsSet('sc_incidents', seedIncidents());
  lsSet('sc_messages', seedMessages());
  lsSet('sc_sos_events', []);
  lsSet('sc_trips', []);
  // Initial member locations
  const locs: MemberLocation[] = SEED_USERS.map(u => ({
    userId: u.id,
    circleId: DEMO_CIRCLE_ID,
    location: { ...ROUTES[u.id][0], timestamp: now() },
    batteryLevel: u.id === 'user-anita' ? 12 : Math.floor(Math.random() * 50) + 50,
    batteryCharging: u.id === 'user-rahul',
    status: 'safe' as const,
    isSharing: true,
    lastSeen: now(),
  }));
  lsSet('sc_locations', locs);
  lsSet('sc_privacy', {} as Record<string, PrivacySettings>);
  lsSet('sc_seeded', true);
}

// ── start simulation loop ────────────────────────────────────────────────────
function startSimulation(): void {
  const INTERVAL_MS = 4000;
  setInterval(() => {
    const locs: MemberLocation[] = ls<MemberLocation[]>('sc_locations', []);
    const currentUserId = ls<string | null>('sc_current_user_id', null);
    const updated = locs.map(ml => {
      // Only simulate other members, not the current user
      if (ml.userId === currentUserId) return ml;

      const route = ROUTES[ml.userId];
      if (!route) return ml;
      const idx = routeIndices[ml.userId] ?? 0;
      const nextIdx = (idx + 1) % route.length;
      routeIndices[ml.userId] = nextIdx;
      const newLoc: MemberLocation = {
        ...ml,
        location: { ...route[nextIdx], timestamp: now() },
        lastSeen: now(),
        batteryLevel: Math.max(ml.batteryLevel - 0.01, 0),
      };
      broadcast({ type: 'location', payload: newLoc });
      return newLoc;
    });
    lsSet('sc_locations', updated);

    // Append history for each simulated member
    updated.forEach(ml => {
      if (ml.userId === currentUserId) return;
      const histKey = `sc_history_${ml.userId}_${new Date().toISOString().split('T')[0]}`;
      const hist = ls<LocationPoint[]>(histKey, []);
      hist.push(ml.location);
      if (hist.length > 500) hist.splice(0, hist.length - 500);
      lsSet(histKey, hist);
    });
  }, INTERVAL_MS);
}

let simulationStarted = false;

// ── DemoAdapter class ────────────────────────────────────────────────────────
export class DemoAdapter implements DataService {
  constructor() {
    ensureSeeded();
    if (!simulationStarted) {
      simulationStarted = true;
      startSimulation();
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  async signIn(email: string, _password: string): Promise<User> {
    const users = ls<User[]>('sc_users', []);
    let user = users.find(u => u.email === email);
    if (!user) {
      // Create new user on sign-in for demo
      user = {
        id: uuid(), name: email.split('@')[0], email, phone: '', avatar: '👤',
        role: 'Member', emergencyContacts: [], createdAt: now(),
      };
      users.push(user);
      lsSet('sc_users', users);
    }
    lsSet('sc_current_user_id', user.id);
    lsSet('sc_current_user', user);
    return user;
  }

  async signUp(email: string, _password: string, name: string, phone: string): Promise<User> {
    const users = ls<User[]>('sc_users', []);
    const existing = users.find(u => u.email === email);
    if (existing) throw new Error('User already exists');
    const user: User = {
      id: uuid(), name, email, phone, avatar: '👤',
      role: 'Member', emergencyContacts: [], createdAt: now(),
    };
    users.push(user);
    lsSet('sc_users', users);
    lsSet('sc_current_user_id', user.id);
    lsSet('sc_current_user', user);
    return user;
  }

  async signOut(): Promise<void> {
    localStorage.removeItem('sc_current_user_id');
    localStorage.removeItem('sc_current_user');
  }

  async getCurrentUser(): Promise<User | null> {
    return ls<User | null>('sc_current_user', null);
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const current = ls<User | null>('sc_current_user', null);
    if (!current) throw new Error('Not authenticated');
    const updated = { ...current, ...updates };
    const users = ls<User[]>('sc_users', []);
    lsSet('sc_users', users.map(u => u.id === updated.id ? updated : u));
    lsSet('sc_current_user', updated);
    return updated;
  }

  // ── Circles ───────────────────────────────────────────────────────────────
  async createCircle(name: string): Promise<Circle> {
    const user = ls<User | null>('sc_current_user', null);
    if (!user) throw new Error('Not authenticated');
    const circle: Circle = {
      id: uuid(), name,
      inviteCode: Math.random().toString(36).toUpperCase().slice(2, 8),
      adminId: user.id, createdAt: now(), memberCount: 1,
    };
    const circles = ls<Circle[]>('sc_circles', []);
    circles.push(circle);
    lsSet('sc_circles', circles);
    const memberships = ls<Membership[]>('sc_memberships', []);
    memberships.push({ userId: user.id, circleId: circle.id, role: 'Admin', joinedAt: now() });
    lsSet('sc_memberships', memberships);
    return circle;
  }

  async joinCircle(inviteCode: string): Promise<Circle> {
    const user = ls<User | null>('sc_current_user', null);
    if (!user) throw new Error('Not authenticated');
    const circles = ls<Circle[]>('sc_circles', []);
    const circle = circles.find(c => c.inviteCode === inviteCode);
    if (!circle) throw new Error('Invalid invite code');
    const memberships = ls<Membership[]>('sc_memberships', []);
    const alreadyMember = memberships.find(m => m.userId === user.id && m.circleId === circle.id);
    if (!alreadyMember) {
      memberships.push({ userId: user.id, circleId: circle.id, role: 'Member', joinedAt: now() });
      lsSet('sc_memberships', memberships);
    }
    return circle;
  }

  async getMyCircles(): Promise<Circle[]> {
    const user = ls<User | null>('sc_current_user', null);
    if (!user) return [];
    const memberships = ls<Membership[]>('sc_memberships', []);
    const myCircleIds = memberships.filter(m => m.userId === user.id).map(m => m.circleId);
    const circles = ls<Circle[]>('sc_circles', []);
    // Auto-join demo circle for convenience
    if (!myCircleIds.includes(DEMO_CIRCLE_ID)) {
      memberships.push({ userId: user.id, circleId: DEMO_CIRCLE_ID, role: 'Member', joinedAt: now() });
      lsSet('sc_memberships', memberships);
      myCircleIds.push(DEMO_CIRCLE_ID);
    }
    return circles.filter(c => myCircleIds.includes(c.id));
  }

  async getCircleMembers(circleId: string): Promise<Membership[]> {
    const memberships = ls<Membership[]>('sc_memberships', []);
    return memberships.filter(m => m.circleId === circleId);
  }

  async leaveCircle(circleId: string): Promise<void> {
    const user = ls<User | null>('sc_current_user', null);
    if (!user) return;
    const memberships = ls<Membership[]>('sc_memberships', []);
    lsSet('sc_memberships', memberships.filter(m => !(m.userId === user.id && m.circleId === circleId)));
  }

  // ── Locations ─────────────────────────────────────────────────────────────
  async publishLocation(circleId: string, location: LocationPoint, battery: number, charging: boolean): Promise<void> {
    const user = ls<User | null>('sc_current_user', null);
    if (!user) return;
    const locs: MemberLocation[] = ls<MemberLocation[]>('sc_locations', []);
    const existing = locs.find(l => l.userId === user.id && l.circleId === circleId);
    const privacy = ls<Record<string, PrivacySettings>>('sc_privacy', {});
    const userPrivacy = privacy[user.id];
    const isSharing = !userPrivacy?.isPaused && !userPrivacy?.isGhostMode;

    const ml: MemberLocation = {
      userId: user.id, circleId,
      location: { ...location, timestamp: now() },
      batteryLevel: battery, batteryCharging: charging,
      status: 'safe', isSharing, lastSeen: now(),
    };
    if (existing) {
      lsSet('sc_locations', locs.map(l => (l.userId === user.id && l.circleId === circleId) ? ml : l));
    } else {
      lsSet('sc_locations', [...locs, ml]);
    }
    broadcast({ type: 'location', payload: ml });

    // Append to history
    const histKey = `sc_history_${user.id}_${new Date().toISOString().split('T')[0]}`;
    const hist = ls<LocationPoint[]>(histKey, []);
    hist.push(ml.location);
    if (hist.length > 500) hist.splice(0, hist.length - 500);
    lsSet(histKey, hist);
  }

  async getMemberLocations(circleId: string): Promise<MemberLocation[]> {
    const locs: MemberLocation[] = ls<MemberLocation[]>('sc_locations', []);
    return locs.filter(l => l.circleId === circleId);
  }

  subscribeToLocations(circleId: string, cb: (loc: MemberLocation) => void): () => void {
    let bc: BroadcastChannel;
    try {
      bc = new BroadcastChannel(BC_NAME);
      bc.onmessage = (e: MessageEvent<BCMessage>) => {
        if (e.data.type === 'location' && e.data.payload.circleId === circleId) {
          cb(e.data.payload);
        }
      };
    } catch { return () => {}; }
    return () => bc.close();
  }

  async getLocationHistory(userId: string, date: string): Promise<LocationPoint[]> {
    const histKey = `sc_history_${userId}_${date}`;
    return ls<LocationPoint[]>(histKey, []);
  }

  // ── Geofences ─────────────────────────────────────────────────────────────
  async createGeofence(geofence: Omit<Geofence, 'id' | 'createdAt'>): Promise<Geofence> {
    const gf: Geofence = { ...geofence, id: uuid(), createdAt: now() };
    const geofences = ls<Geofence[]>('sc_geofences', []);
    geofences.push(gf);
    lsSet('sc_geofences', geofences);
    return gf;
  }

  async getGeofences(circleId: string): Promise<Geofence[]> {
    const geofences = ls<Geofence[]>('sc_geofences', []);
    return geofences.filter(g => g.circleId === circleId);
  }

  async deleteGeofence(id: string): Promise<void> {
    const geofences = ls<Geofence[]>('sc_geofences', []);
    lsSet('sc_geofences', geofences.filter(g => g.id !== id));
  }

  // ── Alerts ────────────────────────────────────────────────────────────────
  async getAlerts(circleId: string, limit = 50): Promise<Alert[]> {
    const alerts = ls<Alert[]>('sc_alerts', []);
    return alerts.filter(a => a.circleId === circleId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async markAlertRead(id: string): Promise<void> {
    const alerts = ls<Alert[]>('sc_alerts', []);
    lsSet('sc_alerts', alerts.map(a => a.id === id ? { ...a, read: true } : a));
  }

  subscribeToAlerts(circleId: string, cb: (alert: Alert) => void): () => void {
    let bc: BroadcastChannel;
    try {
      bc = new BroadcastChannel(BC_NAME);
      bc.onmessage = (e: MessageEvent<BCMessage>) => {
        if (e.data.type === 'alert' && e.data.payload.circleId === circleId) {
          cb(e.data.payload);
        }
      };
    } catch { return () => {}; }
    return () => bc.close();
  }

  // ── SOS ───────────────────────────────────────────────────────────────────
  async triggerSOS(circleId: string, location: LocationPoint, triggerType: SOSEvent['triggerType']): Promise<SOSEvent> {
    const user = ls<User | null>('sc_current_user', null);
    if (!user) throw new Error('Not authenticated');
    const event: SOSEvent = {
      id: uuid(), userId: user.id, circleId, location,
      timestamp: now(), resolved: false, triggerType,
    };
    const events = ls<SOSEvent[]>('sc_sos_events', []);
    events.push(event);
    lsSet('sc_sos_events', events);

    const alert: Alert = {
      id: uuid(), type: 'sos', userId: user.id, userName: user.name,
      circleId, message: `🆘 ${user.name} triggered SOS!`,
      location, timestamp: now(), read: false, severity: 'critical',
    };
    const alerts = ls<Alert[]>('sc_alerts', []);
    alerts.push(alert);
    lsSet('sc_alerts', alerts);
    broadcast({ type: 'sos', payload: event });
    broadcast({ type: 'alert', payload: alert });
    return event;
  }

  async resolveSOSEvent(id: string): Promise<void> {
    const events = ls<SOSEvent[]>('sc_sos_events', []);
    lsSet('sc_sos_events', events.map(e => e.id === id ? { ...e, resolved: true, resolvedAt: now() } : e));
  }

  async getSOSHistory(circleId: string): Promise<SOSEvent[]> {
    const events = ls<SOSEvent[]>('sc_sos_events', []);
    return events.filter(e => e.circleId === circleId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // ── Trips ─────────────────────────────────────────────────────────────────
  async startTrip(trip: Omit<Trip, 'id' | 'startedAt' | 'status'>): Promise<Trip> {
    const t: Trip = { ...trip, id: uuid(), startedAt: now(), status: 'active' };
    const trips = ls<Trip[]>('sc_trips', []);
    trips.push(t);
    lsSet('sc_trips', trips);
    return t;
  }

  async updateTripStatus(id: string, status: TripStatus): Promise<void> {
    const trips = ls<Trip[]>('sc_trips', []);
    lsSet('sc_trips', trips.map(t => t.id === id ? { ...t, status } : t));
  }

  async getActiveTrip(userId: string): Promise<Trip | null> {
    const trips = ls<Trip[]>('sc_trips', []);
    return trips.find(t => t.userId === userId && t.status === 'active') ?? null;
  }

  // ── Incidents ─────────────────────────────────────────────────────────────
  async reportIncident(incident: Omit<IncidentReport, 'id' | 'timestamp' | 'upvotes' | 'userUpvoted'>): Promise<IncidentReport> {
    const ir: IncidentReport = { ...incident, id: uuid(), timestamp: now(), upvotes: 0, userUpvoted: false };
    const incidents = ls<IncidentReport[]>('sc_incidents', []);
    incidents.push(ir);
    lsSet('sc_incidents', incidents);
    return ir;
  }

  async getIncidents(bounds: { north: number; south: number; east: number; west: number }): Promise<IncidentReport[]> {
    const incidents = ls<IncidentReport[]>('sc_incidents', []);
    return incidents.filter(i =>
      i.location.lat >= bounds.south && i.location.lat <= bounds.north &&
      i.location.lng >= bounds.west && i.location.lng <= bounds.east
    );
  }

  async upvoteIncident(id: string): Promise<void> {
    const incidents = ls<IncidentReport[]>('sc_incidents', []);
    lsSet('sc_incidents', incidents.map(i =>
      i.id === id ? { ...i, upvotes: i.upvotes + 1, userUpvoted: true } : i
    ));
  }

  // ── Messages ──────────────────────────────────────────────────────────────
  async sendMessage(circleId: string, content: string, isQuickReply = false): Promise<Message> {
    const user = ls<User | null>('sc_current_user', null);
    if (!user) throw new Error('Not authenticated');
    const msg: Message = {
      id: uuid(), circleId, userId: user.id, userName: user.name,
      userAvatar: user.avatar, content, timestamp: now(), isQuickReply,
    };
    const messages = ls<Message[]>('sc_messages', []);
    messages.push(msg);
    lsSet('sc_messages', messages);
    broadcast({ type: 'message', payload: msg });
    return msg;
  }

  async getMessages(circleId: string, limit = 50): Promise<Message[]> {
    const messages = ls<Message[]>('sc_messages', []);
    return messages.filter(m => m.circleId === circleId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  }

  subscribeToMessages(circleId: string, cb: (msg: Message) => void): () => void {
    let bc: BroadcastChannel;
    try {
      bc = new BroadcastChannel(BC_NAME);
      bc.onmessage = (e: MessageEvent<BCMessage>) => {
        if (e.data.type === 'message' && e.data.payload.circleId === circleId) {
          cb(e.data.payload);
        }
      };
    } catch { return () => {}; }
    return () => bc.close();
  }

  // ── Privacy ───────────────────────────────────────────────────────────────
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    const privacy = ls<Record<string, PrivacySettings>>('sc_privacy', {});
    return privacy[userId] ?? { isPaused: false, isGhostMode: false, visibleToMembers: [], autoDeleteAfterDays: 0 };
  }

  async updatePrivacySettings(userId: string, settings: PrivacySettings): Promise<void> {
    const privacy = ls<Record<string, PrivacySettings>>('sc_privacy', {});
    privacy[userId] = settings;
    lsSet('sc_privacy', privacy);
  }

  // ── Analytics ─────────────────────────────────────────────────────────────
  async getAdminAnalytics(circleId: string): Promise<AdminAnalytics> {
    const alerts = ls<Alert[]>('sc_alerts', []).filter(a => a.circleId === circleId);
    const sosEvents = ls<SOSEvent[]>('sc_sos_events', []).filter(e => e.circleId === circleId);

    // Build alerts per day for last 7 days
    const alertsPerDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      return {
        date: dateStr,
        count: alerts.filter(a => a.timestamp.startsWith(dateStr)).length,
      };
    });

    const activeMembersPerDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().split('T')[0], count: Math.floor(Math.random() * 4) + 1 };
    });

    const geofenceBreaches = alerts.filter(a => a.type === 'geofence_exit').length;
    const resolvedSOS = sosEvents.filter(e => e.resolved && e.resolvedAt);
    const avgResponseTime = resolvedSOS.length > 0
      ? resolvedSOS.reduce((acc, e) => {
          const diff = new Date(e.resolvedAt!).getTime() - new Date(e.timestamp).getTime();
          return acc + diff / 60000;
        }, 0) / resolvedSOS.length
      : 0;

    return {
      alertsPerDay,
      activeMembersPerDay,
      geofenceBreaches,
      avgSOSResponseTimeMinutes: Math.round(avgResponseTime),
      totalSOS: sosEvents.length,
      totalAlerts: alerts.length,
    };
  }
}
