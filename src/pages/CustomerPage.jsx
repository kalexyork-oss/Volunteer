import React, { useState, useEffect } from 'react';
import { getMyBookings } from '../lib/db';

function StatusBadge({ status }) {
  const map = { Pending: 'badge-yellow', Accepted: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

export default function CustomerPage({ userId, onBook }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!userId) return;
    getMyBookings(userId).then(({ data }) => {
      setBookings(data || []);
      setLoading(false);
    });
  }, [userId]);

  if (loading) return (
    <div className="section" style={{ textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      <p style={{ color: 'var(--gray-500)' }}>Loading your bookings...</p>
    </div>
  );

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 24, color: 'var(--navy)' }}>My Bookings</h2>
          <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>Track all your service requests</p>
        </div>
        <button className="btn-primary" onClick={onBook}>+ New Request</button>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h3 style={{ marginBottom: 8 }}>No bookings yet</h3>
          <p style={{ marginBottom: 20, color: 'var(--gray-500)' }}>Book your first service to get started</p>
          <button className="btn-primary" onClick={onBook}>Book a Service</button>
        </div>
      ) : bookings.map(b => (
        <div key={b.id} className="card" style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 48, height: 48, background: 'var(--navy)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🛠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: 16 }}>{b.service}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>📅 {b.date} at {b.time} · 📍 {b.zip}</div>
                {b.notes && <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>"{b.notes}"</div>}
              </div>
              <StatusBadge status={b.status} />
            </div>
            {b.providers?.profiles?.name && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Provider: </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{b.providers.profiles.name}</span>
              </div>
            )}
            {!b.provider_id && b.status === 'Pending' && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--gold)' }}>⏳ Waiting for a provider to accept...</div>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {b.price && <><div style={{ fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>${b.price}</div><div style={{ fontSize: 12, color: 'var(--gray-400)' }}>est.</div></>}
          </div>
        </div>
      ))}
    </div>
  );
}
