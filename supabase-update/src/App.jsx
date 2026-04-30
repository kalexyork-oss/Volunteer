import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { getProfile, getProviderById, getAllProviders, getMyBookings } from './lib/db';

import AuthModal        from './components/AuthModal';
import BookingModal     from './components/BookingModal';
import PostServiceModal from './components/PostServiceModal';
import { Toast }        from './components/UI';

import LandingPage  from './pages/LandingPage';
import CustomerPage from './pages/CustomerPage';
import ProviderPage from './pages/ProviderPage';
import AdminPage    from './pages/AdminPage';

// ---- Navbar ----
function Navbar({ page, setPage, user, profile, onSignIn, onSignOut, onBook }) {
  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => setPage('home')} style={{ cursor: 'pointer' }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="14" fill="rgba(34,197,94,0.2)" />
          <path d="M8 14.5l4 4 8-8" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Volun<span>teer</span>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {[['home','Home'],['customer','My Bookings'],['provider','Provider'],['admin','Admin']].map(([k,l]) => (
          <button key={k} className={`nav-tab ${page === k ? 'active' : ''}`} onClick={() => setPage(k)}>{l}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {user ? (
          <>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Hi, {profile?.name?.split(' ')[0] || 'there'}</span>
            <button className="btn-outline btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', padding: '7px 14px' }} onClick={onSignOut}>Sign Out</button>
          </>
        ) : (
          <button className="btn-outline btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', padding: '7px 14px' }} onClick={onSignIn}>Sign In</button>
        )}
        <button className="btn-primary btn-sm" onClick={onBook}>Book Now</button>
      </div>
    </nav>
  );
}

export default function App() {
  const [page,            setPage]            = useState('home');
  const [user,            setUser]            = useState(null);
  const [profile,         setProfile]         = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [providers,       setProviders]       = useState([]);
  const [bookings,        setBookings]        = useState([]);
  const [showAuth,        setShowAuth]        = useState(false);
  const [showBook,        setShowBook]        = useState(false);
  const [showPost,        setShowPost]        = useState(false);
  const [toast,           setToast]           = useState(null);
  const [loading,         setLoading]         = useState(true);

  const showToast = useCallback(msg => setToast(msg), []);

  // Load providers on mount
  const loadProviders = useCallback(async () => {
    const { data } = await getAllProviders();
    setProviders(data || []);
  }, []);

  // Load user session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUser(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUser(session.user);
      else { setUser(null); setProfile(null); setProviderProfile(null); }
    });

    loadProviders();

    return () => subscription.unsubscribe();
  }, [loadProviders]);

  const loadUser = async (u) => {
    setUser(u);
    const { data: p } = await getProfile(u.id);
    setProfile(p);
    const { data: prov } = await getProviderById(u.id);
    setProviderProfile(prov);
    const { data: b } = await getMyBookings(u.id);
    setBookings(b || []);
    setLoading(false);
  };

  const handleAuthSuccess = (u) => {
    showToast('Welcome to Volunteer!');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setProviderProfile(null); setBookings([]);
    setPage('home');
    showToast('Signed out.');
  };

  const handleBookSuccess = (booking) => {
    setBookings(prev => [booking, ...prev]);
    showToast(booking.provider_id ? 'Booking confirmed!' : 'Open request posted!');
    setPage('customer');
  };

  const handlePostSuccess = (prov) => {
    setProviderProfile(prov);
    loadProviders();
    showToast('Provider profile published!');
    setPage('provider');
  };

  const openBook = useCallback(() => {
    if (!user) { setShowAuth(true); return; }
    setShowBook(true);
  }, [user]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✓</div>
      <p style={{ color: 'var(--gray-500)' }}>Loading Volunteer...</p>
    </div>
  );

  return (
    <div>
      <Navbar
        page={page} setPage={setPage}
        user={user} profile={profile}
        onSignIn={() => setShowAuth(true)}
        onSignOut={handleSignOut}
        onBook={openBook}
      />

      {page === 'home'     && <LandingPage  providers={providers} bookings={bookings} onBook={openBook} setPage={setPage} />}
      {page === 'customer' && <CustomerPage userId={user?.id} onBook={openBook} />}
      {page === 'provider' && (
        <ProviderPage
          userId={user?.id}
          profile={profile}
          providerProfile={providerProfile}
          onPost={() => { if (!user) { setShowAuth(true); return; } setShowPost(true); }}
          onRefresh={loadProviders}
        />
      )}
      {page === 'admin' && <AdminPage />}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />}

      {showBook && (
        <BookingModal
          onClose={() => setShowBook(false)}
          onSuccess={handleBookSuccess}
          providers={providers}
          userId={user?.id}
        />
      )}

      {showPost && (
        <PostServiceModal
          onClose={() => setShowPost(false)}
          onSuccess={handlePostSuccess}
          userId={user?.id}
        />
      )}

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
