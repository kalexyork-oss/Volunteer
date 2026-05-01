import React, { useState, useEffect } from 'react';
import { getPendingBookings, getProviderBookings, acceptBooking, updateBookingStatus } from '../lib/db';
import { supabase } from '../lib/supabase';

function StatusBadge({ status }) {
  const map = { Pending: 'badge-yellow', Accepted: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

export default function ProviderPage({ userId, profile, providerProfile, onPost, onRefresh }) {
  const [tab,       setTab]       = useState('available');
  const [available, setAvailable] = useState([]);
  const [myJobs,    setMyJobs]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [online,    setOnline]    = useState(providerProfile?.available ?? true);
  const [toggling,  setToggling]  = useState(false);
  const [acting,    setActing]    = useState(null); // bookingId being acted on

  const load = async () => {
    setLoading(true);
    const [{ data: pending }, { data: mine }] = await Promise.all([
      getPendingBookings(),
      userId ? getProviderBookings(userId) : { data: [] },
    ]);
    setAvailable(pending || []);
    setMyJobs(mine || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);
  useEffect(() => { setOnline(providerProfile?.available ?? true); }, [providerProfile]);

  const toggleOnline = async () => {
    if (!userId) return;
    setToggling(true);
    const newStatus = !online;
    await supabase.from('providers').update({ available: newStatus }).eq('id', userId);
    setOnline(newStatus);
    if (onRefresh) setTimeout(() => onRefresh(), 500);
    setToggling(false);
  };

  const handleAccept = async (bookingId) => {
    setActing(bookingId);
    const { error } = await acceptBooking(bookingId, userId);
    if (error) { alert('Error: ' + error.message); }
    setActing(null);
    load();
    if (onRefresh) onRefresh();
  };

  const handleDecline = async (bookingId) => {
    if (!window.confirm('Decline this job? It will go back to open requests for other providers.')) return;
    setActing(bookingId);
    // Set back to Pending with no provider
    await supabase.from('bookings').update({ provider_id: null, status: 'Pending' }).eq('id', bookingId);
    setActing(null);
    load();
  };

  const handleComplete = async (bookingId) => {
    setActing(bookingId);
    await updateBookingStatus(bookingId, 'Completed');
    // Update job count
    if (userId) {
      await supabase.from('providers').update({ job_count: (providerProfile?.job_count || 0) + 1 }).eq('id', userId);
    }
    setActing(null);
    load();
  };

  const activeJobs    = myJobs.filter(b => b.status === 'Accepted');
  const completedJobs = myJobs.filter(b => b.status === 'Completed');

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, color: 'var(--gray-800)' }}>Provider Dashboard</h2>
          <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>Find jobs and manage your work</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {providerProfile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: online ? '#f0fdf4' : 'var(--gray-50)',
              border: `1.5px solid ${online ? '#86efac' : 'var(--gray-200)'}`,
              borderRadius: 12, padding: '8px 16px', transition: 'all .3s',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: online ? 'var(--green)' : 'var(--gray-400)', boxShadow: online ? '0 0 0 3px rgba(34,197,94,0.2)' : 'none', transition: 'all .3s' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: online ? '#15803d' : 'var(--gray-500)' }}>
                {online ? 'Online' : 'Offline'}
              </span>
              <div onClick={!toggling ? toggleOnline : undefined} style={{ width: 40, height: 22, borderRadius: 100, background: online ? 'var(--green)' : 'var(--gray-300)', cursor: toggling ? 'not-allowed' : 'pointer', position: 'relative', transition: 'background .3s', opacity: toggling ? 0.6 : 1 }}>
                <div style={{ position: 'absolute', top: 3, left: online ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left .25s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
              </div>
            </div>
          )}
          <button className="btn-primary" onClick={onPost}>{providerProfile ? '✏️ Edit Profile' : '+ Create Profile'}</button>
        </div>
      </div>

      {/* Offline banner */}
      {providerProfile && !online && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>😴</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#854d0e', fontSize: 14 }}>You're offline</div>
            <div style={{ fontSize: 13, color: '#a16207' }}>You won't appear in search results until you go back online.</div>
          </div>
          <button onClick={toggleOnline} style={{ background: '#854d0e', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Go Online</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          ['Open Jobs',   available.length,      '📋'],
          ['Active',      activeJobs.length,     '✅'],
          ['Completed',   completedJobs.length,  '🏆'],
          ['Status',      online ? 'Online' : 'Offline', online ? '🟢' : '🔴'],
        ].map(([label, value, icon]) => (
          <div key={label} style={{ background: 'var(--navy)', borderRadius: 14, padding: '18px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontFamily: 'Sora', fontSize: 20, fontWeight: 700, color: 'white' }}>{value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="tab-pills" style={{ marginBottom: 24 }}>
        {[['available','Available Jobs'],['active','My Active Jobs'],['completed','Completed'],['profile','My Profile']].map(([k, l]) => (
          <button key={k} className={`tab-pill ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-500)' }}>Loading...</div>}

      {/* ---- AVAILABLE JOBS ---- */}
      {!loading && tab === 'available' && (
        <div>
          {available.length === 0 ? (
            <div className="empty-state"><div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div><p>No open requests right now. Check back soon!</p></div>
          ) : available.map(b => (
            <div key={b.id} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: 16 }}>{b.service}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>📅 {b.date} at {b.time} · 📍 {b.zip}</div>
                  {b.notes && <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>"{b.notes}"</div>}
                </div>
                {b.price && (
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--green)' }}>${b.price}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>est. pay</div>
                  </div>
                )}
                {userId ? (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => handleAccept(b.id)}
                      disabled={acting === b.id}
                    >
                      {acting === b.id ? '...' : 'Accept ✓'}
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Sign in to accept</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- ACTIVE JOBS ---- */}
      {!loading && tab === 'active' && (
        <div>
          {activeJobs.length === 0 ? (
            <div className="empty-state"><p>No active jobs. Accept jobs from "Available Jobs".</p></div>
          ) : activeJobs.map(b => (
            <div key={b.id} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: 16 }}>{b.service}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>📅 {b.date} at {b.time} · 📍 {b.zip}</div>
                  {b.notes && <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>"{b.notes}"</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <StatusBadge status={b.status} />
                  {b.price && <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 16 }}>${b.price}</span>}
                </div>
              </div>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--gray-100)' }}>
                <button
                  onClick={() => handleComplete(b.id)}
                  disabled={acting === b.id}
                  style={{ background: 'var(--green)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {acting === b.id ? '...' : '✅ Mark as Completed'}
                </button>
                <button
                  onClick={() => handleDecline(b.id)}
                  disabled={acting === b.id}
                  style={{ background: 'none', border: '1.5px solid #fca5a5', color: '#ef4444', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                >
                  Decline Job
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- COMPLETED ---- */}
      {!loading && tab === 'completed' && (
        <div>
          {completedJobs.length === 0 ? (
            <div className="empty-state"><div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div><p>No completed jobs yet.</p></div>
          ) : completedJobs.map(b => (
            <div key={b.id} className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{b.service}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>{b.date} · 📍 {b.zip}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {b.price && <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 16 }}>${b.price}</span>}
                <StatusBadge status={b.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- PROFILE ---- */}
      {tab === 'profile' && (
        <div className="card">
          {providerProfile ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h3 style={{ fontSize: 20, color: 'var(--gray-800)' }}>{profile?.name}</h3>
                <span className={`badge ${online ? 'badge-green' : 'badge-gray'}`}>{online ? '● Online' : '○ Offline'}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: 12 }}>{providerProfile.bio || 'No bio yet.'}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {(providerProfile.skills || []).map(s => <span key={s} className="badge badge-green">{s}</span>)}
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                📍 {providerProfile.zip || profile?.zip}
                {providerProfile.hourly_rate && ` · $${providerProfile.hourly_rate}/hr`}
                {providerProfile.service_radius && ` · ${providerProfile.service_radius}mi radius`}
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--gray-200)' }}>
                <button className="btn-outline btn-sm" onClick={onPost}>Edit Profile</button>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
              <h3 style={{ marginBottom: 8 }}>No provider profile yet</h3>
              <p style={{ marginBottom: 16, color: 'var(--gray-500)' }}>Create your profile to appear in search and accept jobs.</p>
              <button className="btn-primary" onClick={onPost}>Create Profile</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
