import { supabase } from './supabase';

// ---- AUTH ----

export async function signUp({ email, password, name, role, zip }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role, zip } },
  });
  return { data, error };
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ---- PROFILES ----

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

// ---- PROVIDERS ----

export async function getAllProviders() {
  const { data, error } = await supabase
    .from('providers')
    .select(`*, profiles(name, zip)`)
    .eq('available', true)
    .order('rating', { ascending: false });
  return { data, error };
}

export async function getProviderById(id) {
  const { data, error } = await supabase
    .from('providers')
    .select(`*, profiles(name, email, zip)`)
    .eq('id', id)
    .single();
  return { data, error };
}

export async function upsertProvider({ id, headline, bio, skills, hourly_rate, zip }) {
  const { data, error } = await supabase
    .from('providers')
    .upsert({ id, headline, bio, skills, hourly_rate, zip, available: true })
    .select()
    .single();
  return { data, error };
}

// ---- BOOKINGS ----

export async function createBooking({ customerId, providerId, service, date, time, zip, notes, price }) {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      customer_id: customerId,
      provider_id: providerId || null,
      service, date, time, zip, notes,
      price: price || null,
      status: providerId ? 'Accepted' : 'Pending',
    })
    .select()
    .single();
  return { data, error };
}

export async function getMyBookings(userId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, providers(profiles(name))')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getPendingBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, profiles(name)')
    .eq('status', 'Pending')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getProviderBookings(providerId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function acceptBooking(bookingId, providerId) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ provider_id: providerId, status: 'Accepted' })
    .eq('id', bookingId)
    .select()
    .single();
  return { data, error };
}

export async function updateBookingStatus(bookingId, status) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();
  return { data, error };
}

// ---- ADMIN ----

export async function getAllBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, providers(profiles(name))')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function getAllProvidersAdmin() {
  const { data, error } = await supabase
    .from('providers')
    .select('*, profiles(name, email, zip)');
  return { data, error };
}
