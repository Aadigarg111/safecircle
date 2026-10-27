import type { DataService } from './data-service';
import type {
  User, Circle, Membership, MemberLocation, Geofence, Alert,
  SOSEvent, Trip, IncidentReport, Message, PrivacySettings, AdminAnalytics, LocationPoint, TripStatus
} from '@/types';

// This adapter is used when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.
// It wraps Supabase client with RLS-aware calls.
export class SupabaseAdapter implements DataService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: any = null;
  private currentUser: User | null = null;

  constructor(private url: string, private anonKey: string) {
    // Lazy import to avoid loading supabase when not needed
    import('@supabase/supabase-js').then(({ createClient }) => {
      this.supabase = createClient(this.url, this.anonKey);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getSupabase(): Promise<any> {
    if (!this.supabase) {
      const { createClient } = await import('@supabase/supabase-js');
      this.supabase = createClient(this.url, this.anonKey);
    }
    return this.supabase;
  }

  async signIn(email: string, password: string): Promise<User> {
    const sb = await this.getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
    this.currentUser = profile as User;
    return this.currentUser!;
  }

  async signUp(email: string, password: string, name: string, phone: string): Promise<User> {
    const sb = await this.getSupabase();
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
    const profile: Partial<User> = {
      id: data.user!.id, name, email, phone, avatar: '👤',
      role: 'Member', emergencyContacts: [], createdAt: new Date().toISOString(),
    };
    await sb.from('profiles').insert(profile);
    this.currentUser = profile as User;
    return this.currentUser!;
  }

  async signOut(): Promise<void> {
    const sb = await this.getSupabase();
    await sb.auth.signOut();
    this.currentUser = null;
  }

  async getCurrentUser(): Promise<User | null> {
    const sb = await this.getSupabase();
    const { data } = await sb.auth.getUser();
    if (!data.user) return null;
    const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
    this.currentUser = profile as User;
    return this.currentUser;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('profiles').update(updates).eq('id', this.currentUser!.id).select().single();
    this.currentUser = data as User;
    return this.currentUser!;
  }

  async createCircle(name: string): Promise<Circle> {
    const sb = await this.getSupabase();
    const circle = {
      name,
      admin_id: this.currentUser!.id,
      invite_code: Math.random().toString(36).toUpperCase().slice(2, 8),
    };
    const { data } = await sb.from('circles').insert(circle).select().single();
    return data as Circle;
  }

  async joinCircle(inviteCode: string): Promise<Circle> {
    const sb = await this.getSupabase();
    const { data: circle } = await sb.from('circles').select('*').eq('invite_code', inviteCode).single();
    if (!circle) throw new Error('Invalid invite code');
    await sb.from('memberships').insert({ user_id: this.currentUser!.id, circle_id: circle.id, role: 'Member' });
    return circle as Circle;
  }

  async getMyCircles(): Promise<Circle[]> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('memberships').select('circles(*)').eq('user_id', this.currentUser!.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data?.map((d: any) => d.circles) ?? []) as Circle[];
  }

  async getCircleMembers(circleId: string): Promise<Membership[]> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('memberships').select('*').eq('circle_id', circleId);
    return (data ?? []) as Membership[];
  }

  async leaveCircle(circleId: string): Promise<void> {
    const sb = await this.getSupabase();
    await sb.from('memberships').delete().eq('user_id', this.currentUser!.id).eq('circle_id', circleId);
  }

  async publishLocation(circleId: string, location: LocationPoint, battery: number, charging: boolean): Promise<void> {
    const sb = await this.getSupabase();
    const row = {
      user_id: this.currentUser!.id,
      circle_id: circleId,
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      speed: location.speed,
      battery_level: battery,
      battery_charging: charging,
    };
    await sb.from('locations').upsert(row, { onConflict: 'user_id,circle_id' });
  }

  async getMemberLocations(circleId: string): Promise<MemberLocation[]> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('locations').select('*').eq('circle_id', circleId);
    return (data ?? []) as unknown as MemberLocation[];
  }

  subscribeToLocations(circleId: string, cb: (loc: MemberLocation) => void): () => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;
    this.getSupabase().then(sb => {
      channel = sb.channel(`locations:${circleId}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'locations',
          filter: `circle_id=eq.${circleId}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, (payload: any) => cb(payload.new as unknown as MemberLocation))
        .subscribe();
    });
    return () => { channel?.unsubscribe(); };
  }

  async getLocationHistory(userId: string, date: string): Promise<LocationPoint[]> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('location_history')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', `${date}T00:00:00Z`)
      .lte('timestamp', `${date}T23:59:59Z`);
    return (data ?? []) as unknown as LocationPoint[];
  }

  async createGeofence(geofence: Omit<Geofence, 'id' | 'createdAt'>): Promise<Geofence> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('geofences').insert(geofence).select().single();
    return data as Geofence;
  }

  async getGeofences(circleId: string): Promise<Geofence[]> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('geofences').select('*').eq('circle_id', circleId);
    return (data ?? []) as Geofence[];
  }

  async deleteGeofence(id: string): Promise<void> {
    const sb = await this.getSupabase();
    await sb.from('geofences').delete().eq('id', id);
  }

  async getAlerts(circleId: string, limit = 50): Promise<Alert[]> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('alerts')
      .select('*')
      .eq('circle_id', circleId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    return (data ?? []) as Alert[];
  }

  async markAlertRead(id: string): Promise<void> {
    const sb = await this.getSupabase();
    await sb.from('alerts').update({ read: true }).eq('id', id);
  }

  subscribeToAlerts(circleId: string, cb: (alert: Alert) => void): () => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;
    this.getSupabase().then(sb => {
      channel = sb.channel(`alerts:${circleId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'alerts',
          filter: `circle_id=eq.${circleId}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, (payload: any) => cb(payload.new as Alert))
        .subscribe();
    });
    return () => { channel?.unsubscribe(); };
  }

  async triggerSOS(circleId: string, location: LocationPoint, triggerType: SOSEvent['triggerType']): Promise<SOSEvent> {
    const sb = await this.getSupabase();
    const row = {
      user_id: this.currentUser!.id,
      circle_id: circleId,
      lat: location.lat,
      lng: location.lng,
      trigger_type: triggerType,
    };
    const { data } = await sb.from('sos_events').insert(row).select().single();
    return data as unknown as SOSEvent;
  }

  async resolveSOSEvent(id: string): Promise<void> {
    const sb = await this.getSupabase();
    await sb.from('sos_events').update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', id);
  }

  async getSOSHistory(circleId: string): Promise<SOSEvent[]> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('sos_events')
      .select('*')
      .eq('circle_id', circleId)
      .order('timestamp', { ascending: false });
    return (data ?? []) as unknown as SOSEvent[];
  }

  async startTrip(trip: Omit<Trip, 'id' | 'startedAt' | 'status'>): Promise<Trip> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('trips').insert({ ...trip, status: 'active' }).select().single();
    return data as Trip;
  }

  async updateTripStatus(id: string, status: TripStatus): Promise<void> {
    const sb = await this.getSupabase();
    await sb.from('trips').update({ status }).eq('id', id);
  }

  async getActiveTrip(userId: string): Promise<Trip | null> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('trips')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    return data as Trip | null;
  }

  async reportIncident(incident: Omit<IncidentReport, 'id' | 'timestamp' | 'upvotes' | 'userUpvoted'>): Promise<IncidentReport> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('incident_reports').insert(incident).select().single();
    return data as IncidentReport;
  }

  async getIncidents(bounds: { north: number; south: number; east: number; west: number }): Promise<IncidentReport[]> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('incident_reports').select('*')
      .gte('lat', bounds.south)
      .lte('lat', bounds.north)
      .gte('lng', bounds.west)
      .lte('lng', bounds.east);
    return (data ?? []) as unknown as IncidentReport[];
  }

  async upvoteIncident(id: string): Promise<void> {
    const sb = await this.getSupabase();
    await sb.rpc('increment_upvote', { incident_id: id });
  }

  async sendMessage(circleId: string, content: string, isQuickReply = false): Promise<Message> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('messages').insert({
      circle_id: circleId,
      user_id: this.currentUser!.id,
      content,
      is_quick_reply: isQuickReply,
    }).select().single();
    return data as Message;
  }

  async getMessages(circleId: string, limit = 50): Promise<Message[]> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('messages')
      .select('*')
      .eq('circle_id', circleId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    return ((data ?? []) as Message[]).reverse();
  }

  subscribeToMessages(circleId: string, cb: (msg: Message) => void): () => void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;
    this.getSupabase().then(sb => {
      channel = sb.channel(`messages:${circleId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `circle_id=eq.${circleId}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, (payload: any) => cb(payload.new as Message))
        .subscribe();
    });
    return () => { channel?.unsubscribe(); };
  }

  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    const sb = await this.getSupabase();
    const { data } = await sb.from('privacy_settings').select('*').eq('user_id', userId).single();
    return (data ?? {
      isPaused: false,
      isGhostMode: false,
      visibleToMembers: [],
      autoDeleteAfterDays: 0,
    }) as PrivacySettings;
  }

  async updatePrivacySettings(userId: string, settings: PrivacySettings): Promise<void> {
    const sb = await this.getSupabase();
    await sb.from('privacy_settings').upsert({ user_id: userId, ...settings });
  }

  async getAdminAnalytics(circleId: string): Promise<AdminAnalytics> {
    const sb = await this.getSupabase();
    const { data: alertData } = await sb.from('alerts')
      .select('timestamp,type')
      .eq('circle_id', circleId);
    const alerts = (alertData ?? []) as { timestamp: string; type: string }[];

    const { data: sosData } = await sb.from('sos_events')
      .select('timestamp,resolved,resolved_at')
      .eq('circle_id', circleId);
    const sosEvents = (sosData ?? []) as { timestamp: string; resolved: boolean; resolved_at?: string }[];

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
      return { date: d.toISOString().split('T')[0], count: 0 };
    });

    const geofenceBreaches = alerts.filter(a => a.type === 'geofence_exit').length;
    const resolvedSOS = sosEvents.filter(e => e.resolved && e.resolved_at);
    const avgResponseTime = resolvedSOS.length > 0
      ? resolvedSOS.reduce((acc, e) => {
          const diff = new Date(e.resolved_at!).getTime() - new Date(e.timestamp).getTime();
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
