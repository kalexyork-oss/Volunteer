import React, { useState, useEffect, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { supabase } from './lib/supabase';
import { getProfile, getProviderById, getAllProviders, getMyBookings } from './lib/db';
import { sendNotification, sendSMSNotification } from './lib/notifications';
import './darkmode.css';

import Navbar            from './components/Navbar';
import AuthModal         from './components/AuthModal';
import BookingModal      from './components/BookingModal';
import PostServiceModal  from './components/PostServiceModal';
import ChatModal         from './components/ChatModal';
import { Toast }         from './components/UI';

import LandingPage       from './pages/LandingPage';
import CustomerPage      from './pages/CustomerPage';
import ProviderPage      from './pages/ProviderPage';
import AdminPage         from './pages/AdminPage';
import SettingsPage      from './pages/SettingsPage';
import PublicProfilePage from './pages/PublicProfilePage';
import MessagesPage      from './pages/MessagesPage';
import MapPage           from './pages/MapPage';
import LegalPage         from './pages/LegalPage';

export default function App() {
  const [page,            setPage]            = useState('home');
  const [viewProfileId,   setViewProfileId]   = useState(null);
  const [bookProviderId,  setBookProviderId]   = useState(null);
  const [user,            setUser]            = useState(null);
  const [profile,         setProfile]         = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [providers,       setProviders]       = useState([]);
  const [bookings,        setBookings]        = useState([]);
  const [showAuth,        setShowAuth]        = useState(false);
  const [authMode,        setAuthMode]        = useState('signin');
  const [showBook,        setShowBook]        = useState(false);
  const [showPost,        setShowPost]        = useState(false);
  const [activeChat,      setActiveChat]      = useState(null);
  const [toast,           setToast]           = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [darkMode,        setDarkMode]        = useState(() => localStorage.getItem('volunteer_dark_mode') === 'true');

  useEffect(() => { document.body.classList.toggle('dark', darkMode); }, [darkMode]);

  const showToast = useCallback(msg => setToast(msg), []);

  const loadProviders = useCallback(async () => {
    const { data } = await getAllProviders();
    setProviders(data || []);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUser(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { setAuthMode('reset'); setShowAuth(true); return; }
      if (session?.user) loadUser(session.user);
      else { setUser(null); setProfile(null); setProviderProfile(null); }
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'true') { setAuthMode('reset'); setShowAuth(true); }

    loadProviders();
    return () => subscription.unsubscribe();
  }, [loadProviders]);

  const loadUser = async (u) => {
    setUser(u);
    const [{ data: p }, { data: prov }, { data: b }] = await Promise.all([
      getProfile(u.id),
      getProviderById(u.id),
      getMyBookings(u.id),
    ]);
    setProfile(p);
    setProviderProfile(prov);
    setBookings(b || []);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setProviderProfile(null); setBookings([]);
    setPage('home');
    showToast('Signed out.');
  };

  const handleBookSuccess = useCallback(async (booking) => {
    setBookings(prev => [booking, ...prev]);
    showToast(booking.provider_id ? 'Booking confirmed!' : 'Open request posted!');
    setPage('customer');
    if (booking.provider_id) {
      sendNotification('booking_received', { bookingId: booking.id, providerId: booking.provider_id, customerId: user?.id });
      sendSMSNotification('booking_received', { bookingId: booking.id, providerId: booking.provider_id, customerId: user?.id });
    }
  }, [user, showToast]);

  const handleJobAccepted = useCallback(async (booking) => {
    if (booking?.customer_id) {
      sendNotification('booking_accepted', { bookingId: booking.id, providerId: user?.id, customerId: booking.customer_id });
    }
  }, [user]);

  const handleJobCompleted = useCallback(async (booking) => {
    if (booking?.customer_id) {
      sendNotification('booking_completed', { bookingId: booking.id, providerId: user?.id, customerId: booking.customer_id });
    }
  }, [user]);

  const handlePostSuccess = (prov) => {
    setProviderProfile(prov);
    loadProviders();
    showToast('Profile saved!');
    setPage('provider');
  };

  const openBook = useCallback((providerId = null) => {
    if (!user) { setShowAuth(true); return; }
    setBookProviderId(providerId);
    setShowBook(true);
  }, [user]);

  const viewProfile = useCallback((providerId) => {
    setViewProfileId(providerId);
    setPage('profile');
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✓</div>
      <p style={{ color: 'var(--gray-500)' }}>Loading Volunteer...</p>
    </div>
  );

  return (
    <div>
      <Navbar
        page={page}
        setPage={setPage}
        user={user}
        profile={profile}
        onSignIn={() => setShowAuth(true)}
        onSignOut={handleSignOut}
        onBook={() => openBook()}
      />

      {page === 'home'     && <LandingPage providers={providers} bookings={bookings} onBook={openBook} setPage={setPage} onViewProfile={viewProfile} onNavigate={setPage} />}
      {page === 'map'      && <MapPage providers={providers} onBook={openBook} onViewProfile={viewProfile} />}
      {page === 'customer' && <CustomerPage userId={user?.id} onBook={() => openBook()} onOpenChat={setActiveChat} />}
      {page === 'messages' && <MessagesPage currentUserId={user?.id} currentUserName={profile?.name} profile={profile} />}
      {page === 'provider' && (
        <ProviderPage
          userId={user?.id} profile={profile} providerProfile={providerProfile}
          onPost={() => { if (!user) { setShowAuth(true); return; } setShowPost(true); }}
          onRefresh={loadProviders}
          onJobAccepted={handleJobAccepted}
          onJobCompleted={handleJobCompleted}
        />
      )}
      {page === 'admin'    && <AdminPage />}
      {page === 'settings' && <SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} user={user} profile={profile} onProfileUpdate={p => setProfile(p)} />}
      {page === 'profile'  && <PublicProfilePage providerId={viewProfileId} onBook={openBook} onBack={() => setPage('home')} />}
      {page === 'legal'    && <LegalPage />}

      {showAuth  && <AuthModal onClose={() => { setShowAuth(false); setAuthMode('signin'); }} onSuccess={() => showToast('Welcome!')} initialMode={authMode} />}
      {showBook  && <BookingModal onClose={() => { setShowBook(false); setBookProviderId(null); }} onSuccess={handleBookSuccess} providers={providers} userId={user?.id} preselectedProviderId={bookProviderId} />}
      {showPost  && <PostServiceModal onClose={() => setShowPost(false)} onSuccess={handlePostSuccess} userId={user?.id} existing={providerProfile} />}
      {activeChat && <ChatModal booking={activeChat.booking} currentUserId={user?.id} currentUserName={profile?.name} otherUserName={activeChat.otherName} onClose={() => setActiveChat(null)} />}
      {toast     && <Toast msg={toast} onClose={() => setToast(null)} />}
      <Analytics />
    </div>
  );
}
