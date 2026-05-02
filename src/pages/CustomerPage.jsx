import React, { useState, useEffect } from 'react';
import { getMyBookings, updateBookingStatus, submitReview } from '../lib/db';

function StatusBadge({ status }) {
  const map = { Pending: 'badge-yellow', Accepted: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          style={{ fontSize: 28, cursor: 'pointer', color: i <= (hover || value) ? '#f59e0b' : '#e2e8f0', transition: 'color .1s' }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewModal({ booking, userId, onClose, onDone }) {
  const [rating, setRating] = useState(5);
  const [body,   setBody]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSubmit = async () => {
    if (!rating) { setError('Please select a star rating.'); return; }
    setSaving(true);
    const { error: err } = await submitReview({
      bookingId:  booking.id,
      reviewerId: userId,
      providerId: booking.provider_id,
      rating,
      body,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onDone();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, color: 'var(--navy)' }}>Leave a Review</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{booking.service}</div>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
            Provider: {booking.providers?.profiles?.name || 'Unknown'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label>Your Rating *</label>
            <div style={{ marginTop: 8 }}>
              <StarPicker value={rating} onChange={setRating} />
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>
                {['','Terrible','Poor','Okay','Good','Excellent!'][rating]}
              </div>
            </div>
          </div>

          <div>
            <label>Your Review (optional)</label>
            <textarea
              rows={4} style={{ resize: 'none' }}
              placeholder="How was the experience? Would you recommend this provider?"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          </div>

          {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991b1b' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSubmit} disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Review ⭐'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerPage({ userId, onBook, onOpenChat }) {
  const [bookings,      setBookings]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [filter,        setFilter]        = useState('all');
  const [cancelling,    setCancelling]    = useState(null);

  const load = async () => {
    if (!userId) return;
    const { data } = await getMyBookings(userId);
    setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(bookingId);
    await updateBookingStatus(bookingId, 'Cancelled');
    setCancelling(null);
    load();
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status.toLowerCase() === filter);

  const FILTERS = [['all','All'],['pending','Pending'],['accepted','Accepted'],['completed','Completed'],['cancelled','Cancelled']];

  if (loading) return (
    <div className="section" style={{ textAlign: 'center', paddingTop: 80 }}>
      <p style={{ color: 'var(--gray-500)' }}>Loading your bookings...</p>
    </div>
  );

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, color: 'var(--gray-800)' }}>My Bookings</h2>
          <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>Track all your service requests</p>
        </div>
        <button className="btn-primary" onClick={onBook}>+ New Request</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {FILTERS.map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', border: 'none', transition: 'all .2s',
            background: filter === k ? 'var(--navy)' : 'var(--gray-100)',
            color: filter === k ? 'white' : 'var(--gray-600)',
          }}>
            {l}
            {k !== 'all' && <span style={{ marginLeft: 6, opacity: .7 }}>({bookings.filter(b => b.status.toLowerCase() === k).length})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h3 style={{ marginBottom: 8 }}>No {filter === 'all' ? '' : filter} bookings</h3>
          {filter === 'all' && <button className="btn-primary" onClick={onBook}>Book your first service</button>}
        </div>
      ) : filtered.map(b => (
        <div key={b.id} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 48, height: 48, background: 'var(--navy)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🛠️</div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: 16 }}>{b.service}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
                    📅 {b.date} at {b.time} &nbsp;·&nbsp; 📍 {b.zip}
                  </div>
                  {b.notes && <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>"{b.notes}"</div>}
                </div>
                <StatusBadge status={b.status} />
              </div>

              {b.providers?.profiles?.name && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Provider:</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{b.providers.profiles.name}</span>
                </div>
              )}

              {!b.provider_id && b.status === 'Pending' && (
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--gold)' }}>⏳ Waiting for a provider to accept...</div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {/* Chat button — show when there's a provider */}
                {b.provider_id && b.status !== 'Cancelled' && onOpenChat && (
                  <button
                    onClick={() => onOpenChat({ booking: b, otherName: b.providers?.profiles?.name || 'Provider' })}
                    style={{ background: 'none', border: '1.5px solid var(--gray-200)', color: 'var(--navy)', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    💬 Chat
                  </button>
                )}

                {/* Cancel button — only for Pending or Accepted */}
                {(b.status === 'Pending' || b.status === 'Accepted') && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    disabled={cancelling === b.id}
                    style={{ background: 'none', border: '1.5px solid #fca5a5', color: '#ef4444', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                  >
                    {cancelling === b.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}

                {/* Leave review — only for Completed, no review yet */}
                {b.status === 'Completed' && b.provider_id && (
                  <button
                    onClick={() => setReviewBooking(b)}
                    style={{ background: 'none', border: '1.5px solid #fde68a', color: '#92400e', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                  >
                    ⭐ Leave a Review
                  </button>
                )}
              </div>
            </div>

            {b.price && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>${b.price}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>est.</div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Review modal */}
      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          userId={userId}
          onClose={() => setReviewBooking(null)}
          onDone={load}
        />
      )}
    </div>
  );
}
