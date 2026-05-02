import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getNotifications, markAsRead, markAllAsRead, subscribeToNotifications } from '../lib/notifications';

const TYPE_ICONS = {
  booking_received:  '📋',
  booking_accepted:  '✅',
  booking_completed: '🏆',
  booking_cancelled: '❌',
  new_review:        '⭐',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationBell({ userId, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [open,          setOpen]          = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [newBounce,     setNewBounce]     = useState(false);
  const dropdownRef = useRef(null);

  const unread = notifications.filter(n => !n.read).length;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await getNotifications(userId);
    setNotifications(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;
    const channel = subscribeToNotifications(userId, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setNewBounce(true);
      setTimeout(() => setNewBounce(false), 1000);
    });
    return () => { channel.unsubscribe(); };
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => { setOpen(o => !o); };

  const handleClick = async (notif) => {
    if (!notif.read) await markAsRead(notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setOpen(false);
    if (notif.link_page && onNavigate) onNavigate(notif.link_page);
  };

  const handleMarkAll = async () => {
    await markAllAsRead(userId);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          position: 'relative', background: open ? 'rgba(255,255,255,0.15)' : 'none',
          border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8,
          transition: 'all .2s', animation: newBounce ? 'bellBounce .5s ease' : 'none',
        }}
      >
        <span style={{ fontSize: 20 }}>🔔</span>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#ef4444', color: 'white',
            borderRadius: '50%', width: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, border: '2px solid var(--navy)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 8,
          width: 360, maxHeight: 480, overflowY: 'auto',
          background: 'white', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,.15)', border: '1px solid var(--gray-200)',
          zIndex: 200,
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', borderRadius: '16px 16px 0 0' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', fontFamily: 'Sora' }}>Notifications</span>
              {unread > 0 && <span style={{ marginLeft: 8, background: '#ef4444', color: 'white', borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{unread} new</span>}
            </div>
            {unread > 0 && (
              <button onClick={handleMarkAll} style={{ background: 'none', border: 'none', color: 'var(--green-dark)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)', fontSize: 14 }}>Loading...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🔔</div>
              <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No notifications yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  padding: '14px 20px', cursor: 'pointer', transition: 'background .15s',
                  background: n.read ? 'white' : '#f0fdf4',
                  borderBottom: '1px solid var(--gray-100)',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
                onMouseOver={e => e.currentTarget.style.background = n.read ? 'var(--gray-50)' : '#dcfce7'}
                onMouseOut={e => e.currentTarget.style.background = n.read ? 'white' : '#f0fdf4'}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: n.read ? 'var(--gray-100)' : 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {TYPE_ICONS[n.type] || '📬'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 14, color: 'var(--navy)', marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>{timeAgo(n.created_at)}</div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, marginTop: 4 }} />}
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        @keyframes bellBounce {
          0%,100% { transform: rotate(0); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-20deg); }
        }
      `}</style>
    </div>
  );
}
