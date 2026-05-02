import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ChatModal from '../components/ChatModal';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

export default function MessagesPage({ currentUserId, currentUserName, profile }) {
  const [conversations, setConversations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeChat,    setActiveChat]    = useState(null);
  const [unreadCounts,  setUnreadCounts]  = useState({});

  const load = async () => {
    if (!currentUserId) return;
    setLoading(true);

    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        bookings(service, date, status),
        customer:profiles!conversations_customer_id_fkey(id, name, avatar_url),
        provider:profiles!conversations_provider_id_fkey(id, name, avatar_url)
      `)
      .or(`customer_id.eq.${currentUserId},provider_id.eq.${currentUserId}`)
      .order('last_message_at', { ascending: false });

    setConversations(data || []);

    // Get unread counts
    const counts = {};
    for (const conv of (data || [])) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', currentUserId)
        .eq('read', false);
      if (count > 0) counts[conv.id] = count;
    }
    setUnreadCounts(counts);
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentUserId]);

  // Real-time updates
  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, load)
      .subscribe();
    return () => channel.unsubscribe();
  }, [currentUserId]);

  const getOtherUser = (conv) => {
    return conv.customer_id === currentUserId ? conv.provider : conv.customer;
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  if (!currentUserId) return (
    <div className="section empty-state">
      <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
      <h3>Sign in to view messages</h3>
    </div>
  );

  return (
    <div className="section" style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, color: 'var(--gray-800)', display: 'flex', alignItems: 'center', gap: 10 }}>
            Messages
            {totalUnread > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: 100, padding: '2px 10px', fontSize: 13, fontWeight: 600 }}>{totalUnread}</span>}
          </h2>
          <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>Chat with customers and providers</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>Loading conversations...</div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 52, marginBottom: 12 }}>💬</div>
          <h3 style={{ marginBottom: 8 }}>No conversations yet</h3>
          <p style={{ color: 'var(--gray-500)' }}>When you book a service or accept a job, you'll be able to chat here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {conversations.map(conv => {
            const other    = getOtherUser(conv);
            const unread   = unreadCounts[conv.id] || 0;
            const initials = (other?.name || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

            return (
              <div
                key={conv.id}
                onClick={() => setActiveChat(conv)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px', borderRadius: 14, cursor: 'pointer',
                  background: unread > 0 ? '#f0fdf4' : 'white',
                  border: `1px solid ${unread > 0 ? '#bbf7d0' : 'var(--gray-200)'}`,
                  transition: 'all .15s', marginBottom: 8,
                }}
                onMouseOver={e => e.currentTarget.style.background = unread > 0 ? '#dcfce7' : 'var(--gray-50)'}
                onMouseOut={e => e.currentTarget.style.background = unread > 0 ? '#f0fdf4' : 'white'}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {other?.avatar_url ? (
                    <img src={other.avatar_url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18 }}>
                      {initials}
                    </div>
                  )}
                  {unread > 0 && (
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                      {unread}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: unread > 0 ? 700 : 600, fontSize: 15, color: 'var(--navy)' }}>{other?.name || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', flexShrink: 0, marginLeft: 8 }}>{timeAgo(conv.last_message_at)}</div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
                    {conv.bookings?.service} · {conv.bookings?.date}
                  </div>
                  {conv.last_message && (
                    <div style={{ fontSize: 13, color: unread > 0 ? 'var(--gray-700)' : 'var(--gray-400)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: unread > 0 ? 500 : 400 }}>
                      {conv.last_message}
                    </div>
                  )}
                </div>

                <span style={{ fontSize: 16, color: 'var(--gray-300)', flexShrink: 0 }}>›</span>
              </div>
            );
          })}
        </div>
      )}

      {activeChat && (
        <ChatModal
          booking={{ ...activeChat.bookings, id: activeChat.booking_id, customer_id: activeChat.customer_id, provider_id: activeChat.provider_id }}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          otherUserName={getOtherUser(activeChat)?.name || 'User'}
          onClose={() => { setActiveChat(null); load(); }}
        />
      )}
    </div>
  );
}
