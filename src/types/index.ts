// All core types for SafeCircle

export type UserRole = 'Admin' | 'Member' | 'Child' | 'Elder';
export type MemberStatus = 'safe' | 'sos' | 'outside_zone' | 'offline' | 'ghost';
export type AlertType = 'geofence_entry' | 'geofence_exit' | 'sos' | 'battery_low' | 'route_deviation' | 'check_in' | 'anomaly' | 'night_checkin';
export type GeofenceShape = 'circle' | 'polygon';
export type TripStatus = 'active' | 'completed' | 'overdue' | 'cancelled';
export type IncidentCategory = 'poor_lighting' | 'harassment' | 'isolated_area' | 'unsafe_road' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string; // emoji or URL
  role: UserRole;
  emergencyContacts: EmergencyContact[];
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface Circle {
  id: string;
  name: string;
  inviteCode: string;
  adminId: string;
  createdAt: string;
  memberCount: number;
}

export interface Membership {
  userId: string;
  circleId: string;
  role: UserRole;
  joinedAt: string;
}

export interface LocationPoint {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number; // m/s
  heading?: number;
  altitude?: number;
  timestamp: string;
}

export interface MemberLocation {
  userId: string;
  circleId: string;
  location: LocationPoint;
  batteryLevel: number; // 0-100
  batteryCharging: boolean;
  status: MemberStatus;
  isSharing: boolean;
  lastSeen: string;
  address?: string;
}

export interface Geofence {
  id: string;
  circleId: string;
  name: string;
  shape: GeofenceShape;
  // For circle
  center?: { lat: number; lng: number };
  radius?: number; // meters
  // For polygon
  coordinates?: { lat: number; lng: number }[];
  color: string;
  createdBy: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  userId: string;
  userName: string;
  circleId: string;
  message: string;
  location?: LocationPoint;
  geofenceId?: string;
  geofenceName?: string;
  timestamp: string;
  read: boolean;
  severity: 'info' | 'warning' | 'critical';
}

export interface SOSEvent {
  id: string;
  userId: string;
  circleId: string;
  location: LocationPoint;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  evidenceUrls?: string[];
  triggerType: 'button' | 'shake' | 'silent' | 'voice' | 'night_checkin';
}

export interface Trip {
  id: string;
  userId: string;
  circleId: string;
  destination: string;
  destinationLocation: LocationPoint;
  startLocation: LocationPoint;
  startedAt: string;
  eta: string; // ISO string
  etaMinutes: number;
  status: TripStatus;
  routePolyline?: LocationPoint[];
  actualRoute?: LocationPoint[];
}

export interface IncidentReport {
  id: string;
  userId: string;
  location: LocationPoint;
  category: IncidentCategory;
  description: string;
  timestamp: string;
  upvotes: number;
  userUpvoted?: boolean;
}

export interface Message {
  id: string;
  circleId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  isQuickReply?: boolean;
}

export interface EvidenceFile {
  id: string;
  sosEventId: string;
  userId: string;
  type: 'audio' | 'photo';
  url: string;
  timestamp: string;
  size: number;
}

export interface BatteryLog {
  userId: string;
  level: number;
  charging: boolean;
  timestamp: string;
}

export interface NotificationLog {
  id: string;
  circleId: string;
  type: AlertType;
  title: string;
  body: string;
  timestamp: string;
  targetUserIds: string[];
}

export interface SafePlace {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'pharmacy';
  location: LocationPoint;
  address?: string;
  distance?: number; // meters
  etaMinutes?: number;
}

export interface RouteInfo {
  polyline: LocationPoint[];
  distanceKm: number;
  durationMinutes: number;
  steps?: string[];
}

export interface PrivacySettings {
  isPaused: boolean;
  isGhostMode: boolean;
  visibleToMembers: string[]; // empty = all
  autoDeleteAfterDays: number; // 0 = never
}

export interface AdminAnalytics {
  alertsPerDay: { date: string; count: number }[];
  activeMembersPerDay: { date: string; count: number }[];
  geofenceBreaches: number;
  avgSOSResponseTimeMinutes: number;
  totalSOS: number;
  totalAlerts: number;
}
