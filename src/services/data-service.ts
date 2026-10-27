import type {
  User, Circle, Membership, MemberLocation, Geofence, Alert,
  SOSEvent, Trip, IncidentReport, Message,
  PrivacySettings, AdminAnalytics, LocationPoint, TripStatus
} from '@/types';

export interface DataService {
  // Auth
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string, name: string, phone: string): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  updateProfile(updates: Partial<User>): Promise<User>;

  // Circles
  createCircle(name: string): Promise<Circle>;
  joinCircle(inviteCode: string): Promise<Circle>;
  getMyCircles(): Promise<Circle[]>;
  getCircleMembers(circleId: string): Promise<Membership[]>;
  leaveCircle(circleId: string): Promise<void>;

  // Locations
  publishLocation(circleId: string, location: LocationPoint, battery: number, charging: boolean): Promise<void>;
  getMemberLocations(circleId: string): Promise<MemberLocation[]>;
  subscribeToLocations(circleId: string, cb: (loc: MemberLocation) => void): () => void;
  getLocationHistory(userId: string, date: string): Promise<LocationPoint[]>;

  // Geofences
  createGeofence(geofence: Omit<Geofence, 'id' | 'createdAt'>): Promise<Geofence>;
  getGeofences(circleId: string): Promise<Geofence[]>;
  deleteGeofence(id: string): Promise<void>;

  // Alerts
  getAlerts(circleId: string, limit?: number): Promise<Alert[]>;
  markAlertRead(id: string): Promise<void>;
  subscribeToAlerts(circleId: string, cb: (alert: Alert) => void): () => void;

  // SOS
  triggerSOS(circleId: string, location: LocationPoint, triggerType: SOSEvent['triggerType']): Promise<SOSEvent>;
  resolveSOSEvent(id: string): Promise<void>;
  getSOSHistory(circleId: string): Promise<SOSEvent[]>;

  // Trips
  startTrip(trip: Omit<Trip, 'id' | 'startedAt' | 'status'>): Promise<Trip>;
  updateTripStatus(id: string, status: TripStatus): Promise<void>;
  getActiveTrip(userId: string): Promise<Trip | null>;

  // Incidents
  reportIncident(incident: Omit<IncidentReport, 'id' | 'timestamp' | 'upvotes' | 'userUpvoted'>): Promise<IncidentReport>;
  getIncidents(bounds: { north: number; south: number; east: number; west: number }): Promise<IncidentReport[]>;
  upvoteIncident(id: string): Promise<void>;

  // Messages
  sendMessage(circleId: string, content: string, isQuickReply?: boolean): Promise<Message>;
  getMessages(circleId: string, limit?: number): Promise<Message[]>;
  subscribeToMessages(circleId: string, cb: (msg: Message) => void): () => void;

  // Privacy
  getPrivacySettings(userId: string): Promise<PrivacySettings>;
  updatePrivacySettings(userId: string, settings: PrivacySettings): Promise<void>;

  // Analytics
  getAdminAnalytics(circleId: string): Promise<AdminAnalytics>;
}
