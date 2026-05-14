import React, { useState, useEffect } from 'react';
import { getAllBookings, getAllProvidersAdmin, updateBookingStatus } from '../lib/db';
import { supabase } from '../lib/supabase';

function StatusBadge({ status }) {
  const map = { Pending: 'badge-yellow', Accepted: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

function VerificationBadge({ status }) {
  if (status === 'verified')  return <span style={{ fontSize: 11, fontWeight: 600, color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '3px 8px' }}>✅ Verified</span>;
  if (status === 'pending')   return <span style={{ fontSize: 11, fontWeight: 600, color: '#92400e', background: '#fef9c3', border: '1px solid #fde047', borderRadius: 6, padding: '3px 8px' }}>⏳ Pending</span>;
  if (status === 'rejected')  return <span style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '3px 8px' }}>❌ Rejected</span>;
  return <span style={{ fontSize: 11, color: 'var(--gray-400)', background: 'var(--gray-100)', borderRadius: 6, padding: '3px 8px' }}>Not submitted</span>;
}

export default function AdminPage({ isAdmin }) {
  const [tab,       setTab]       = useState('bookings');
  const [bookings,  setBookings]  = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [imgModal,  setImgModal]  = useState(null);
  const [acting,    setActing]    = useState(null);

  // ---- Access denied screen ----
  if (!isAdmin) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 40 }}>
        <div style={{ fontSize: 64 }}>🔒</div>
        <h2 style={{ fontSize: 24, color: 'var(--navy)', fontFamily: 'Sora' }}>Access Denied</h2>
        <p style={{ color: 'var(--gray-500)', textAlign: 'center', maxWidth: 320 }}>This page is only accessible to platform administrators.</p>
      </div>
    );
  }

  const load = async () => {
    setLoading(true);
    const [{ data: b }, { data: p }] = await Promise.all([getAllBookings(), getAllProvidersAdmin()]);
    setBookings(b || []);
    setProviders(p || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id, status) => {
    await updateBookingStatus(id, status);
    load();
  };

  const handleVerify = async (providerId, approve) => {
    setActing(providerId);
    await supabase.from('providers').update({
      verification_status: approve ? 'verified' : 'rejected',
      verified: approve,
    }).eq('id', providerId);
    setActing(null);
    load();
  };

  // Get signed URL for private ID image
  const viewIdPhoto = async (idUrl) => {
    if (!idUrl) return;
    // If it's already a full URL just open it
    if (idUrl.startsWith('http')) { setImgModal(idUrl); return; }
    const { data } = await supabase.storage.from('verifications').createSignedUrl(idUrl, 60);
    if (data?.signedUrl) setImgModal(data.signedUrl);
  };

  const totalRevenue  = bookings.filter(b => b.status === 'Completed').reduce((a, b) => a + (b.price || 0), 0);
  const pending       = bookings.filter(b => b.status === 'Pending').length;
  const accepted      = bookings.filter(b => b.status === 'Accepted').length;
  const completed     = bookings.filter(b => b.status === 'Completed').length;
  const pendingVerifs = providers.filter(p => p.verification_status === 'pending').length;

  const TABS = [
    ['bookings',     'All Bookings'],
    ['providers',    'All Providers'],
    ['verification', `Verification${pendingVerifs > 0 ? ` (${pendingVerifs})` : ''}`],
  ];

  return (
    <div className="section">
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, color: 'var(--navy)' }}>Admin Panel</h2>
          <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>Platform overview and management</p>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 8, padding: '4px 12px', fontWeight: 600 }}>🔑 Admin</span>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          ['Revenue',     '$' + totalRevenue.toFixed(0), '💰', 'var(--green)'],
          ['Active',       pending + accepted,            '📋', '#3b82f6'],
          ['Providers',    providers.length,              '👥', 'var(--navy)'],
          ['Completed',    completed,                     '✅', '#8b5cf6'],
        ].map(([label, value, icon, accent]) => (
          <div key={label} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: 14, padding: 20, borderTop: `4px solid ${accent}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--navy)', fontFamily: 'Sora' }}>{value}</div>
              </div>
              <div style={{ fontSize: 24 }}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, color: 'var(--navy)', marginBottom: 16 }}>Status Breakdown</h3>
        {[['Pending', pending, '#f59e0b'], ['Accepted', accepted, '#3b82f6'], ['Completed', completed, '#22c55e']].map(([label, count, color]) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{count}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${bookings.length ? (count / bookings.length * 100) : 0}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', border: 'none', transition: 'all .2s',
            background: tab === k ? 'var(--navy)' : 'var(--gray-100)',
            color: tab === k ? 'white' : 'var(--gray-600)',
          }}>{l}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-500)' }}>Loading...</div>}

      {/* BOOKINGS */}
      {!loading && tab === 'bookings' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-200)' }}>
                {['Service','Date','Zip','Provider','Status','Price','Action'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--gray-500)', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '12px', fontWeight: 500, color: 'var(--navy)' }}>{b.service}</td>
                  <td style={{ padding: '12px', color: 'var(--gray-600)' }}>{b.date}</td>
                  <td style={{ padding: '12px', color: 'var(--gray-600)' }}>{b.zip}</td>
                  <td style={{ padding: '12px', color: 'var(--gray-600)' }}>{b.providers?.profiles?.name || '—'}</td>
                  <td style={{ padding: '12px' }}><StatusBadge status={b.status} /></td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{b.price ? '$' + b.price : '—'}</td>
                  <td style={{ padding: '12px' }}>
                    {b.status === 'Accepted' && <button style={{ background: 'var(--green)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', padding: '5px 12px', fontSize: 12 }} onClick={() => handleStatus(b.id, 'Completed')}>Mark Done</button>}
                    {b.status === 'Pending'  && <button style={{ background: 'var(--gray-200)', color: 'var(--gray-600)', border: 'none', borderRadius: 6, cursor: 'pointer', padding: '5px 12px', fontSize: 12 }} onClick={() => handleStatus(b.id, 'Cancelled')}>Cancel</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <div className="empty-state"><p>No bookings yet.</p></div>}
        </div>
      )}

      {/* ALL PROVIDERS */}
      {!loading && tab === 'providers' && (
        <div className="grid-2">
          {providers.length === 0 && <div className="empty-state"><p>No providers yet.</p></div>}
          {providers.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                {(p.profiles?.name || 'P').split(' ').map(w => w[0]).join('').slice(0,2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.profiles?.name}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className={`badge ${p.available ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 11 }}>{p.available ? 'Active' : 'Offline'}</span>
                    <VerificationBadge status={p.verification_status} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{p.profiles?.email}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>📍 {p.zip} {p.hourly_rate ? `· $${p.hourly_rate}/hr` : ''}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {(p.skills || []).slice(0, 4).map(s => <span key={s} className="badge badge-gray" style={{ fontSize: 10 }}>{s}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VERIFICATION TAB */}
      {!loading && tab === 'verification' && (
        <div>
          {/* Pending */}
          {providers.filter(p => p.verification_status === 'pending').length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <h3 style={{ marginBottom: 8 }}>No pending verifications</h3>
              <p style={{ color: 'var(--gray-500)' }}>When providers submit their ID, they'll appear here for review.</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', marginBottom: 16 }}>
                {providers.filter(p => p.verification_status === 'pending').length} pending review
              </div>
              {providers.filter(p => p.verification_status === 'pending').map(p => (
                <div key={p.id} className="card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                      {(p.profiles?.name || 'P').split(' ').map(w => w[0]).join('').slice(0,2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{p.profiles?.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{p.profiles?.email}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>📍 {p.zip} · {p.job_count || 0} jobs · ⭐ {p.rating || 'No rating'}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                        {(p.skills || []).slice(0, 5).map(s => <span key={s} className="badge badge-gray" style={{ fontSize: 11 }}>{s}</span>)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                      {p.id_url && (
                        <button
                          onClick={() => viewIdPhoto(p.id_url)}
                          style={{ background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                        >
                          🪪 View ID Photo
                        </button>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleVerify(p.id, true)}
                          disabled={acting === p.id}
                          style={{ background: 'var(--green)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        >
                          {acting === p.id ? '...' : '✅ Verify'}
                        </button>
                        <button
                          onClick={() => handleVerify(p.id, false)}
                          disabled={acting === p.id}
                          style={{ background: 'none', border: '1.5px solid #fca5a5', color: '#ef4444', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Already verified */}
          {providers.filter(p => p.verification_status === 'verified').length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 12 }}>
                ✅ Verified Providers ({providers.filter(p => p.verification_status === 'verified').length})
              </div>
              <div className="grid-2">
                {providers.filter(p => p.verification_status === 'verified').map(p => (
                  <div key={p.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                      {(p.profiles?.name || 'P').split(' ').map(w => w[0]).join('').slice(0,2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#15803d' }}>{p.profiles?.name} ✅</div>
                      <div style={{ fontSize: 12, color: '#166534' }}>{p.profiles?.email}</div>
                    </div>
                    <button
                      onClick={() => handleVerify(p.id, false)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ID Photo modal */}
      {imgModal && (
        <div onClick={() => setImgModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', flexDirection: 'column', gap: 16 }}>
          <img src={imgModal} alt="ID" style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 12, objectFit: 'contain' }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Click anywhere to close</span>
        </div>
      )}
    </div>
  );
}
