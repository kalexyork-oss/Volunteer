import { supabase } from './supabase';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;

// ---- Send a notification (calls edge function) ----
export async function sendNotification(type, payload) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ type, ...payload }),
    });
  } catch (e) {
    console.warn('Notification send failed:', e);
  }
}

// ---- SMS notification ----
export async function sendSMSNotification(type, payload) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${SUPABASE_URL}/functions/v1/sms-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ type, ...payload }),
    });
  } catch (e) {
    console.warn('SMS send failed:', e);
  }
}

// ---- Get notifications for current user ----
export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return { data: data || [], error };
}

// ---- Mark notification as read ----
export async function markAsRead(notificationId) {
  return supabase.from('notifications').update({ read: true }).eq('id', notificationId);
}

// ---- Mark all as read ----
export async function markAllAsRead(userId) {
  return supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
}

// ---- Subscribe to real-time notifications ----
export function subscribeToNotifications(userId, onNew) {
  return supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      onNew(payload.new);
    })
    .subscribe();
}
