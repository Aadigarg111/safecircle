import { create } from 'zustand';
import type { User, Circle, MemberLocation, Geofence, Alert, SOSEvent, Trip, Message, PrivacySettings } from '@/types';

interface AppState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Circles
  circles: Circle[];
  activeCircleId: string | null;
  setCircles: (circles: Circle[]) => void;
  setActiveCircleId: (id: string | null) => void;

  // Locations
  memberLocations: MemberLocation[];
  setMemberLocations: (locs: MemberLocation[]) => void;
  updateMemberLocation: (loc: MemberLocation) => void;

  // Geofences
  geofences: Geofence[];
  setGeofences: (geofences: Geofence[]) => void;
  addGeofence: (geofence: Geofence) => void;
  removeGeofence: (id: string) => void;

  // Alerts
  alerts: Alert[];
  unreadAlertCount: number;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  markAlertRead: (id: string) => void;

  // SOS
  activeSOS: SOSEvent | null;
  setActiveSOS: (sos: SOSEvent | null) => void;

  // Active Trip
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;

  // Messages
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;

  // Privacy
  privacySettings: PrivacySettings;
  setPrivacySettings: (settings: PrivacySettings) => void;

  // UI
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  isElderMode: boolean;
  setElderMode: (elder: boolean) => void;
  showSOSModal: boolean;
  setShowSOSModal: (show: boolean) => void;
  showFakeCall: boolean;
  fakeCallName: string;
  setFakeCall: (show: boolean, name?: string) => void;
}

export const useStore = create<AppState>((set) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

  // Circles
  circles: [],
  activeCircleId: null,
  setCircles: (circles) => set({ circles }),
  setActiveCircleId: (id) => set({ activeCircleId: id }),

  // Locations
  memberLocations: [],
  setMemberLocations: (memberLocations) => set({ memberLocations }),
  updateMemberLocation: (loc) =>
    set((state) => ({
      memberLocations: state.memberLocations.some(l => l.userId === loc.userId && l.circleId === loc.circleId)
        ? state.memberLocations.map(l => l.userId === loc.userId && l.circleId === loc.circleId ? loc : l)
        : [...state.memberLocations, loc],
    })),

  // Geofences
  geofences: [],
  setGeofences: (geofences) => set({ geofences }),
  addGeofence: (geofence) => set((state) => ({ geofences: [...state.geofences, geofence] })),
  removeGeofence: (id) => set((state) => ({ geofences: state.geofences.filter(g => g.id !== id) })),

  // Alerts
  alerts: [],
  unreadAlertCount: 0,
  setAlerts: (alerts) => set({ alerts, unreadAlertCount: alerts.filter(a => !a.read).length }),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadAlertCount: state.unreadAlertCount + (alert.read ? 0 : 1),
    })),
  markAlertRead: (id) =>
    set((state) => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, read: true } : a),
      unreadAlertCount: Math.max(0, state.unreadAlertCount - 1),
    })),

  // SOS
  activeSOS: null,
  setActiveSOS: (sos) => set({ activeSOS: sos }),

  // Active Trip
  activeTrip: null,
  setActiveTrip: (trip) => set({ activeTrip: trip }),

  // Messages
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  // Privacy
  privacySettings: { isPaused: false, isGhostMode: false, visibleToMembers: [], autoDeleteAfterDays: 0 },
  setPrivacySettings: (privacySettings) => set({ privacySettings }),

  // UI
  theme: (localStorage.getItem('sc_theme') as 'light' | 'dark') ?? 'light',
  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('sc_theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
      return { theme };
    }),
  language: (localStorage.getItem('sc_lang') as 'en' | 'hi') ?? 'en',
  setLanguage: (lang) => {
    localStorage.setItem('sc_lang', lang);
    set({ language: lang });
  },
  isElderMode: localStorage.getItem('sc_elder') === 'true',
  setElderMode: (isElderMode) => {
    localStorage.setItem('sc_elder', String(isElderMode));
    set({ isElderMode });
  },
  showSOSModal: false,
  setShowSOSModal: (showSOSModal) => set({ showSOSModal }),
  showFakeCall: false,
  fakeCallName: 'Mom',
  setFakeCall: (show, name) => set({ showFakeCall: show, fakeCallName: name ?? 'Mom' }),
}));
