import React, { useState, useEffect, useRef } from 'react';
import { getMyBookings, updateBookingStatus, submitReview, getMyReviews, subscribeToBooking } from '../lib/db';

// ---- Status badge ----
function StatusBadge({ status }) {
  const map = { Pending: 'badge-yellow', Accepted: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

// ---- Star picker ----
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} onClick={() => onChange(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          style={{ fontSize: 28, cursor: 'pointer', color: i <= (hover || value) ? '#f59e0b' : '#e2e8f0', transition: 'color .1s' }}>★</span>
      ))}
    </div>
  );
}

// ---- Live tracking progress bar ----
const TRACKING_STEPS = [
  { key: null,          label: 'Confirmed',   icon: '✅', desc: 'Your booking is confirmed' },
  { key: 'on_the_way',  label: 'On The Way',  icon: '🚗', desc: 'Provider is heading to you' },
  { key: 'arrived',     label: 'Arrived',     icon: '📍', desc: 'Provider has arrived' },
  { key: 'in_progress', label: 'In Progress', icon: '🔧', desc: 'Work is in progress' },
  { key: 'done',        label: 'Completed',   icon: '🏆', desc: 'Job complete!' },
];

function TrackingBar({ booking }) {
  const trackingStatus = booking.tracking_status;
  const isCompleted    = booking.status === 'Completed';

  const currentIndex = isCompleted
    ? 4
    : TRACKING_STEPS.findIndex(s => s.key === trackingStatus);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  const currentStep = TRACKING_STEPS[activeIndex];

  return (
    <div style={{ marginTop: 14, background: 'linear-gradient(135deg, #f0f4ff, #f0fdf4)', border: '1px solid #c7d7fc', borderRadius: 14, padding: '16px 18px' }}>
      {/* Current status headline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {currentStep.icon}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>{currentStep.label}</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{currentStep.desc}</div>
        </div>
        {trackingStatus === 'on_the_way' && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>Live</span>
          </div>
        )}
      </div>

      {/* Progress steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {TRACKING_STEPS.map((step, i) => {
          const done    = i < activeIndex;
          const active  = i === activeIndex;
          const future  = i > activeIndex;
          return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: i < 4 ? 'none' : 1 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: done ? 'var(--green)' : active ? 'var(--navy)' : 'var(--gray-200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: done ? 13 : 11,
                  color: done || active ? 'white' : 'var(--gray-400)',
                  fontWeight: 700,
                  transition: 'all .4s',
                  boxShadow: active ? '0 0 0 4px rgba(15,30,61,0.15)' : 'none',
                }}>
                  {done ? '✓' : step.icon}
                </div>
                <div style={{ fontSize: 9, color: active ? 'var(--navy)' : done ? 'var(--green)' : 'var(--gray-400)', fontWeight: active ? 700 : 400, marginTop: 4, whiteSpace: 'nowrap' }}>
                  {step.label}
                </div>
              </div>
              {i < TRACKING_STEPS.length - 1 && (
                <div style={{ flex: 1, height: 3, background: i < activeIndex ? 'var(--green)' : 'var(--gray-200)', transition: 'background .4s', marginBottom: 16, borderRadius: 2 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }`}</style>
    </div>
  );
}

// ---- Review modal ----
function ReviewModal({ booking, userId, onClose, onDone }) {
  const [rating, setRating] = useState(5);
  const [body,   setBody]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSubmit = async () => {
    if (!rating) { setError('Please select a star rating.'); return; }
    setSaving(true);
    const { error: err } = await submitReview({ bookingId: booking.id, reviewerId: userId, providerId: booking.provider_id, rating, body });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onDone(); onClose();
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
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>Provider: {booking.providers?.profiles?.name || 'Unknown'}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label>Your Rating *</label>
            <div style={{ marginTop: 8 }}>
              <StarPicker value={rating} onChange={setRating} />
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>{['','Terrible','Poor','Okay','Good','Excellent!'][rating]}</div>
            </div>
          </div>
          <div>
            <label>Your Review (optional)</label>
            <textarea rows={4} style={{ resize: 'none' }} placeholder="How was the experience? Would you recommend this provider?" value={body} onChange={e => setBody(e.target.value)} />
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

// ---- Main CustomerPage ----
export default function CustomerPage({ userId, onBook, onOpenChat }) {
  const [bookings,      setBookings]      = useState([]);
  const [reviewedIds,   setReviewedIds]   = useState(new Set());
  const [loading,       setLoading]       = useState(true);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [filter,        setFilter]        = useState('all');
  const [cancelling,    setCancelling]    = useState(null);
  const subscriptions = useRef({});

  const load = async () => {
    if (!userId) return;
    const [{ data: b }, { data: r }] = await Promise.all([
      getMyBookings(userId),
      getMyReviews(userId),
    ]);
    setBookings(b || []);
    setReviewedIds(new Set((r || []).map(rev => rev.booking_id)));
    setLoading(false);
    // Subscribe to live tracking for all active bookings
    (b || []).forEach(booking => {
      if (booking.status === 'Accepted' && !subscriptions.current[booking.id]) {
        subscriptions.current[booking.id] = subscribeToBooking(booking.id, updated => {
          setBookings(prev => prev.map(bk => bk.id === updated.id ? { ...bk, ...updated } : bk));
        });
      }
    });
  };

  useEffect(() => {
    load();
    return () => {
      // Unsubscribe all on unmount
      Object.values(subscriptions.current).forEach(sub => sub?.unsubscribe?.());
    };
  }, [userId]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(bookingId);
    await updateBookingStatus(bookingId, 'Cancelled');
    setCancelling(null);
    load();
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status.toLowerCase() === filter);
  const FILTERS  = [['all','All'],['pending','Pending'],['accepted','Accepted'],['completed','Completed'],['cancelled','Cancelled']];

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

              {/* Status messages */}
              {!b.provider_id && b.status === 'Pending' && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#92400e', background: '#fef9c3', padding: '6px 10px', borderRadius: 8, display: 'inline-block' }}>
                  ⏳ Waiting for a provider to accept...
                </div>
              )}
              {b.provider_id && b.status === 'Pending' && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#1d4ed8', background: '#eff6ff', padding: '6px 10px', borderRadius: 8, display: 'inline-block' }}>
                  🔔 Request sent — waiting for provider to confirm
                </div>
              )}

              {/* LIVE TRACKING BAR — shows for accepted bookings */}
              {b.status === 'Accepted' && b.provider_id && (
                <TrackingBar booking={b} />
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {b.provider_id && b.status !== 'Cancelled' && onOpenChat && (
                  <button
                    onClick={() => onOpenChat({ booking: b, otherName: b.providers?.profiles?.name || 'Provider' })}
                    style={{ background: 'none', border: '1.5px solid var(--gray-200)', color: 'var(--navy)', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    💬 Chat
                  </button>
                )}
                {(b.status === 'Pending' || b.status === 'Accepted') && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    disabled={cancelling === b.id}
                    style={{ background: 'none', border: '1.5px solid #fca5a5', color: '#ef4444', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                  >
                    {cancelling === b.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}
                {b.status === 'Completed' && b.provider_id && !reviewedIds.has(b.id) && (
                  <button
                    onClick={() => setReviewBooking(b)}
                    style={{ background: 'none', border: '1.5px solid #fde68a', color: '#92400e', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                  >
                    ⭐ Leave a Review
                  </button>
                )}
                {b.status === 'Completed' && b.provider_id && reviewedIds.has(b.id) && (
                  <span style={{ fontSize: 13, color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 14px', fontWeight: 500 }}>
                    ✓ Review submitted
                  </span>
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

      {reviewBooking && (
        <ReviewModal booking={reviewBooking} userId={userId} onClose={() => setReviewBooking(null)} onDone={load} />
      )}
    </div>
  );
}
