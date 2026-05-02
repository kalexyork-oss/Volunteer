import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function timeStr(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function dateDivider(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function getOrCreateConversation(bookingId, customerId, providerId) {
  // Try to find existing
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('booking_id', bookingId)
    .single();

  if (existing) return existing;

  // Create new
  const { data, error } = await supabase
    .from('conversations')
    .insert({ booking_id: bookingId, customer_id: customerId, provider_id: providerId })
    .select()
    .single();

  return data;
}

export default function ChatModal({ booking, currentUserId, currentUserName, otherUserName, onClose }) {
  const [conversation, setConversation] = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const channelRef = useRef(null);

  const isCustomer = booking.customer_id === currentUserId;
  const customerId = booking.customer_id;
  const providerId = booking.provider_id;

  const loadMessages = useCallback(async (convId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages(data || []);

    // Mark unread as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', convId)
      .neq('sender_id', currentUserId)
      .eq('read', false);
  }, [currentUserId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const conv = await getOrCreateConversation(booking.id, customerId, providerId);
      if (!conv) { setLoading(false); return; }
      setConversation(conv);
      await loadMessages(conv.id);
      setLoading(false);

      // Subscribe to real-time messages
      channelRef.current = supabase
        .channel(`chat:${conv.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conv.id}`,
        }, async (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          // Mark as read if not sender
          if (payload.new.sender_id !== currentUserId) {
            await supabase.from('messages').update({ read: true }).eq('id', payload.new.id);
          }
        })
        .subscribe();
    };
    init();
    return () => { if (channelRef.current) channelRef.current.unsubscribe(); };
  }, [booking.id, customerId, providerId, loadMessages, currentUserId]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !conversation || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    // Optimistically add message
    const tempId = 'temp-' + Date.now();
    const tempMsg = { id: tempId, conversation_id: conversation.id, sender_id: currentUserId, body: text, read: false, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);

    const { data: newMsg } = await supabase
      .from('messages')
      .insert({ conversation_id: conversation.id, sender_id: currentUserId, body: text })
      .select()
      .single();

    // Replace temp with real
    if (newMsg) {
      setMessages(prev => prev.map(m => m.id === tempId ? newMsg : m));
      // Update conversation last message
      await supabase.from('conversations').update({ last_message: text, last_message_at: new Date().toISOString() }).eq('id', conversation.id);
    }

    setSending(false);
    inputRef.current?.focus();
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = dateDivider(msg.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 480, height: '80vh', maxHeight: 600, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'var(--navy)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
            {(otherUserName || 'U').split(' ').map(w => w[0]).join('').slice(0,2)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'white', fontSize: 15 }}>{otherUserName}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{booking.service} · {booking.date}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 22, padding: 4 }}>✕</button>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
              <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>Start the conversation!</p>
              <p style={{ color: 'var(--gray-400)', fontSize: 13, marginTop: 4 }}>Ask about the job, share details, or just say hello.</p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                {/* Date divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 8px' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500, whiteSpace: 'nowrap' }}>{date}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--gray-200)' }} />
                </div>

                {msgs.map((msg, i) => {
                  const isMine   = msg.sender_id === currentUserId;
                  const prevMsg  = msgs[i - 1];
                  const isNewSender = !prevMsg || prevMsg.sender_id !== msg.sender_id;

                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 2, marginTop: isNewSender ? 8 : 0 }}>
                      <div style={{ maxWidth: '72%' }}>
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMine ? 'var(--navy)' : 'var(--gray-100)',
                          color: isMine ? 'white' : 'var(--gray-800)',
                          fontSize: 14, lineHeight: 1.5,
                          opacity: msg.id?.startsWith('temp-') ? 0.7 : 1,
                        }}>
                          {msg.body}
                        </div>
                        {isNewSender && (
                          <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 3, textAlign: isMine ? 'right' : 'left', padding: '0 4px' }}>
                            {timeStr(msg.created_at)}
                            {isMine && msg.read && ' · ✓✓'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: 10, alignItems: 'flex-end', background: 'white' }}>
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Type a message..."
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            style={{
              flex: 1, resize: 'none', border: '1.5px solid var(--gray-200)', borderRadius: 20,
              padding: '10px 16px', fontSize: 14, fontFamily: 'DM Sans, sans-serif',
              lineHeight: 1.4, outline: 'none', overflowY: 'hidden', maxHeight: 100,
              transition: 'border .2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--navy)'}
            onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none',
              background: input.trim() ? 'var(--navy)' : 'var(--gray-200)',
              color: 'white', cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, transition: 'all .2s', flexShrink: 0,
            }}
          >
            {sending ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}
