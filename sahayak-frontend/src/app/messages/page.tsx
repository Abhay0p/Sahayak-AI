"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { useTranslation } from '@/lib/useTranslation';
import { Send, MessageCircle, User, RefreshCw, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8005';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender?: { firstName: string; lastName: string; role: string; id: string };
  receiver?: { firstName: string; lastName: string; role: string; id: string };
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function fullTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);
  const meId = profile?.id ?? '';

  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Fetch all messages and derive conversations ───────────────────────────
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!meId) return;
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    
    socket.on('connect', () => {
      socket.emit('register', meId);
    });

    socket.on('message-received', (msg: Message) => {
      queryClient.setQueryData<Message[]>(['messages', meId], (old = []) => {
        if (old.find(m => m.id === msg.id)) return old;
        return [...old, msg];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [meId, queryClient]);

  const { data: messages = [], isLoading: loading, error: queryError, refetch: fetchMessages } = useQuery({
    queryKey: ['messages', meId],
    queryFn: async () => {
      if (!meId) return [];
      const data = await apiClient('/api/messages');
      if (!Array.isArray(data)) throw new Error(data.error || 'Failed to load messages');
      return data as Message[];
    },
    enabled: !!meId,
    refetchInterval: 15_000,
  });

  const error = queryError ? (queryError as Error).message : null;

  // Derive conversation list
  const conversations = React.useMemo(() => {
    const partnerMap = new Map<string, Conversation>();
    messages.forEach(m => {
      const isMe = m.senderId === meId;
      const partnerId = isMe ? m.receiverId : m.senderId;
      const partner = isMe ? m.receiver : m.sender;
      const partnerName = partner
        ? `${partner.firstName || ''} ${partner.lastName || ''}`.trim() || 'User'
        : 'User';

      const existing = partnerMap.get(partnerId);
      const unread = !m.read && m.receiverId === meId ? 1 : 0;

      if (!existing || new Date(m.createdAt) > new Date(existing.lastMessageTime)) {
        partnerMap.set(partnerId, {
          partnerId,
          partnerName,
          partnerRole: partner?.role ?? '',
          lastMessage: m.content,
          lastMessageTime: m.createdAt,
          unreadCount: (existing?.unreadCount ?? 0) + unread,
        });
      } else {
        partnerMap.set(partnerId, {
          ...existing,
          unreadCount: existing.unreadCount + unread,
        });
      }
    });
    return Array.from(partnerMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }, [messages, meId]);

  const markReadMutation = useMutation({
    mutationFn: async (senderId: string) => {
      const data = await apiClient('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId }),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', meId] });
    },
    onMutate: async (senderId: string) => {
      await queryClient.cancelQueries({ queryKey: ['messages', meId] });
      const previous = queryClient.getQueryData<Message[]>(['messages', meId]);
      if (previous) {
        queryClient.setQueryData<Message[]>(['messages', meId], 
          previous.map(m => m.senderId === senderId && m.receiverId === meId ? { ...m, read: true } : m)
        );
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['messages', meId], context.previous);
      }
    }
  });

  // ── Mark conversation as read when opened ───────────────────────────────
  useEffect(() => {
    if (!selectedPartnerId || !meId) return;
    const hasUnread = messages.some(m => m.senderId === selectedPartnerId && m.receiverId === meId && !m.read);
    if (hasUnread) {
      markReadMutation.mutate(selectedPartnerId);
    }
  }, [selectedPartnerId, meId, messages]);

  // ── Auto-scroll to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedPartnerId]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async ({ content, receiverId }: { content: string, receiverId: string }) => {
      const data = await apiClient('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, receiverId }),
      });
      return data;
    },
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ['messages', meId] });
      const previous = queryClient.getQueryData<Message[]>(['messages', meId]);

      const optimistic: Message = {
        id: `opt-${Date.now()}`,
        senderId: meId,
        receiverId: newMsg.receiverId,
        content: newMsg.content,
        read: false,
        createdAt: new Date().toISOString(),
        sender: { firstName: profile?.firstName ?? '', lastName: profile?.lastName ?? '', role: profile?.role ?? '', id: meId },
      };

      if (previous) {
        queryClient.setQueryData<Message[]>(['messages', meId], [...previous, optimistic]);
      }
      return { previous, optimisticId: optimistic.id };
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData<Message[]>(['messages', meId], old => {
        if (!old) return [data.data];
        return old.map(m => m.id === context?.optimisticId ? data.data : m);
      });
    },
    onError: (err, variables, context) => {
      setSendError(`Failed to send: ${(err as Error).message}`);
      if (context?.previous) {
        queryClient.setQueryData(['messages', meId], context.previous);
      }
    },
    onSettled: () => {
      setSending(false);
    }
  });

  const sendMessage = async () => {
    if (!input.trim() || !selectedPartnerId || sending) return;
    setSending(true);
    setSendError(null);
    const sentContent = input.trim();
    setInput('');
    
    sendMutation.mutate({ content: sentContent, receiverId: selectedPartnerId });

    // Also notify real-time server directly
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.emit('new-message', {
      to: selectedPartnerId,
      message: {
        id: `opt-${Date.now()}`,
        senderId: meId,
        receiverId: selectedPartnerId,
        content: sentContent,
        read: false,
        createdAt: new Date().toISOString(),
      }
    });
    setTimeout(() => socket.disconnect(), 1000);
  };

  // ── Thread for selected partner ─────────────────────────────────────────
  const thread = selectedPartnerId
    ? messages.filter(m =>
        (m.senderId === selectedPartnerId && m.receiverId === meId) ||
        (m.senderId === meId && m.receiverId === selectedPartnerId)
      )
    : [];

  const selectedConv = conversations.find(c => c.partnerId === selectedPartnerId);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)', color: 'var(--text-main)' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '1.5rem', gap: '1.5rem' }}>

        {/* ── Left: Conversation list ───────────────────────────────── */}
        <div style={{
          width: '320px', flexShrink: 0,
          background: 'var(--bg-card)', borderRadius: '1rem',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={20} style={{ color: '#a855f7' }} />
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Messages</h1>
            </div>
            <button
              onClick={() => { fetchMessages(); }}
              title="Refresh"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '0.25rem' }}
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
            ) : error ? (
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <AlertCircle size={24} style={{ color: '#f87171', marginBottom: '0.5rem' }} />
                <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>
                <button onClick={() => { fetchMessages(); }} style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer' }}>Try Again</button>
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No messages yet.</div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.partnerId}
                  onClick={() => setSelectedPartnerId(conv.partnerId)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '1rem 1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: selectedPartnerId === conv.partnerId ? 'rgba(168,85,247,0.12)' : 'transparent',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 700, color: 'white',
                  }}>
                    {conv.partnerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{conv.partnerName}</span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{relativeTime(conv.lastMessageTime)}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.15rem' }}>
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span style={{
                      background: '#7c3aed', color: 'white', borderRadius: '9999px',
                      fontSize: '0.65rem', fontWeight: 700, minWidth: 18, height: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0,
                    }}>{conv.unreadCount}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: Thread ──────────────────────────────────────────── */}
        <div style={{
          flex: 1, background: 'var(--bg-card)', borderRadius: '1rem',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          minWidth: 0,
        }}>
          {!selectedPartnerId ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
              <MessageCircle size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ fontSize: '1rem' }}>Select a conversation</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0,
                }}>
                  {(selectedConv?.partnerName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedConv?.partnerName}</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{selectedConv?.partnerRole || ''}</p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {thread.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '2rem' }}>No messages yet. Say hello! 👋</p>
                ) : (
                  thread.map(m => {
                    const isMe = m.senderId === meId;
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%',
                          background: isMe ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.07)',
                          padding: '0.75rem 1rem',
                          borderRadius: isMe ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                        }}>
                          <p style={{ fontSize: '0.95rem', color: 'white', lineHeight: 1.5 }}>{m.content}</p>
                          <p style={{ fontSize: '0.7rem', color: isMe ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.35)', marginTop: '0.3rem', textAlign: isMe ? 'right' : 'left' }}>
                            {fullTime(m.createdAt)}
                            {isMe && (
                              <span style={{ marginLeft: '0.35rem' }}>
                                {m.id.startsWith('opt-') ? '⏳' : m.read ? ' ✓✓' : ' ✓'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Send error */}
              {sendError && (
                <div style={{ padding: '0.5rem 1.5rem', background: 'rgba(239,68,68,0.1)', borderTop: '1px solid rgba(239,68,68,0.2)' }}>
                  <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{sendError}</p>
                </div>
              )}

              {/* Composer */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Type a message…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={sending}
                  style={{
                    flex: 1, padding: '0.75rem 1rem', borderRadius: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)', color: 'white',
                    fontSize: '0.95rem', outline: 'none',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  aria-label="Send message"
                  style={{
                    width: 44, height: 44, borderRadius: '0.75rem', flexShrink: 0,
                    background: input.trim() && !sending
                      ? 'linear-gradient(135deg,#7c3aed,#a855f7)'
                      : 'rgba(255,255,255,0.08)',
                    border: 'none', cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', transition: 'background 0.2s',
                  }}
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
