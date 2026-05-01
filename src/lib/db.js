import { supabase } from './supabase';

// ---- AUTH ----
export async function signUp({ email, password, name, role, zip }) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
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

// ---- PROFILES ----
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
}

// ---- PROVIDERS ----
export async function getAllProviders() {
  const { data, error } = await supabase
    .from('providers')
    .select(`*, profiles(name, zip, avatar_url)`)
    .eq('available', true)
    .order('rating', { ascending: false });
  return { data, error };
}

export async function getProviderById(id) {
  const { data, error } = await supabase
    .from('providers')
    .select(`*, profiles(name, email, zip, avatar_url, created_at)`)
    .eq('id', id)
    .single();
  return { data, error };
}

export async function getProviderBySlug(slug) {
  const { data, error } = await supabase
    .from('providers')
    .select(`*, profiles(name, email, zip, avatar_url, created_at)`)
    .eq('custom_slug', slug)
    .single();
  return { data, error };
}

export async function upsertProvider(updates) {
  const { data, error } = await supabase
    .from('providers')
    .upsert(updates)
    .select()
    .single();
  return { data, error };
}

// ---- AVATAR UPLOAD ----
export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
  if (uploadError) return { url: null, error: uploadError };
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

// ---- REVIEWS ----
export async function getProviderReviews(providerId) {
  const { data, error } = await supabase
    .from('reviews')
    .select(`*, profiles(name, avatar_url)`)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function submitReview({ bookingId, reviewerId, providerId, rating, body }) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({ booking_id: bookingId, reviewer_id: reviewerId, provider_id: providerId, rating, body })
    .select()
    .single();
  if (!error) {
    // Update provider rating average
    const { data: reviews } = await supabase.from('reviews').select('rating').eq('provider_id', providerId);
    if (reviews?.length) {
      const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
      await supabase.from('providers').update({ rating: Math.round(avg * 10) / 10, review_count: reviews.length }).eq('id', providerId);
    }
  }
  return { data, error };
}

// ---- BOOKINGS ----
export async function createBooking({ customerId, providerId, service, date, time, zip, notes, price }) {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      customer_id: customerId, provider_id: providerId || null,
      service, date, time, zip, notes, price: price || null,
      status: providerId ? 'Accepted' : 'Pending',
    })
    .select().single();
  return { data, error };
}

export async function getMyBookings(userId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, providers(profiles(name, avatar_url))')
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
    .eq('id', bookingId).select().single();
  return { data, error };
}

export async function updateBookingStatus(bookingId, status) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId).select().single();
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
