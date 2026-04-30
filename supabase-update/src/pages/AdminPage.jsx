import React, { useState, useEffect } from 'react';
import { getAllBookings, getAllProvidersAdmin, updateBookingStatus } from '../lib/db';

function StatusBadge({ status }) {
  const map = { Pending: 'badge-yellow', Accepted: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

export default function AdminPage() {
  const [tab, setTab]           = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading]   = useState(true);

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

  const totalRevenue = bookings.filter(b => b.status === 'Completed').reduce((a, b) => a + (b.price || 0), 0);
  const pending   = bookings.filter(b => b.status === 'Pending').length;
  const accepted  = bookings.filter(b => b.status === 'Accepted').length;
  const completed = bookings.filter(b => b.status === 'Completed').length;

  return (
    <div className="section">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, color: 'var(--navy)' }}>Admin Panel</h2>
        <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>Platform overview and management</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          ['Revenue',      '$' + totalRevenue.toFixed(0), '💰', 'var(--green)'],
          ['Active',        pending + accepted,            '📋', 'var(--blue)'],
          ['Providers',     providers.length,              '👥', 'var(--navy)'],
          ['Completed',     completed,                     '✅', '#8b5cf6'],
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

      <div className="tab-pills" style={{ marginBottom: 20 }}>
        {[['bookings','All Bookings'],['providers','All Providers']].map(([k, l]) => (
          <button key={k} className={`tab-pill ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-500)' }}>Loading...</div>}

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
                    {b.status === 'Accepted' && (
                      <button style={{ background: 'var(--green)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', padding: '5px 12px', fontSize: 12 }} onClick={() => handleStatus(b.id, 'Completed')}>Mark Done</button>
                    )}
                    {b.status === 'Pending' && (
                      <button style={{ background: 'var(--gray-200)', color: 'var(--gray-600)', border: 'none', borderRadius: 6, cursor: 'pointer', padding: '5px 12px', fontSize: 12 }} onClick={() => handleStatus(b.id, 'Cancelled')}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <div className="empty-state"><p>No bookings yet.</p></div>}
        </div>
      )}

      {!loading && tab === 'providers' && (
        <div className="grid-2">
          {providers.length === 0 && <div className="empty-state"><p>No providers yet.</p></div>}
          {providers.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                {(p.profiles?.name || 'P').split(' ').map(w => w[0]).join('').slice(0,2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.profiles?.name}</div>
                  <span className={`badge ${p.available ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 11 }}>{p.available ? 'Active' : 'Offline'}</span>
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
    </div>
  );
}
