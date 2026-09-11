"use client";
import React, {
  useState, useEffect, useRef, useCallback, Suspense
} from 'react';
import { useAuth } from '@/components/AuthProvider/AuthProvider';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { io, Socket } from 'socket.io-client';
import {
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff,
  Image as ImageIcon, ArrowLeft, Users, X, Check, Camera,
  MessageCircle, Clock, ChevronLeft, ChevronRight,
  Send, Trash2
} from 'lucide-react';
import { useCall } from '@/components/CallProvider/CallProvider';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8005';

// ─── Types ───────────────────────────────────────────────────────────────────
interface FamilyMember {
  profileId: string;
  firstName: string;
  lastName?: string;
  preferredName?: string;
  avatarUrl?: string;
  email: string;
  relationshipType: string;
  role: string;
}

interface Memory {
  id: string;
  elderlyId: string;
  uploaderId: string;
  title: string;
  description?: string;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
  uploader?: { firstName: string; lastName?: string; avatarUrl?: string };
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface CallLogEntry {
  id: string;
  callerId: string;
  calleeId: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  caller: { id: string; firstName: string; avatarUrl?: string };
  callee: { id: string; firstName: string; avatarUrl?: string };
}

type Tab = 'contacts' | 'photos' | 'messages' | 'calls';

/** Get JWT from localStorage for direct fetch calls (e.g. to notification service) */
function getToken(): string {
  return (typeof window !== 'undefined' ? localStorage.getItem('sahayak_token') : null) || '';
}

/** Direct fetch with auth header (for endpoints that need raw response) */
async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
function FamilyConnectContent() {
  const { session } = useAuth();
  const router = useRouter();
  const myProfileId = session?.user?.profileId || '';
  const isAuthenticated = session.status === 'authenticated';
  const isLoading = session.status === 'loading';

  const [activeTab, setActiveTab] = useState<Tab>('contacts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ─── Family members ────────────────────────────────────────────────────────
  const [members, setMembers] = useState<FamilyMember[]>([]);

  // ─── Memories ─────────────────────────────────────────────────────────────
  const [memories, setMemories] = useState<Memory[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Messages ─────────────────────────────────────────────────────────────
  const [selectedContact, setSelectedContact] = useState<FamilyMember | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Call logs ─────────────────────────────────────────────────────────────
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);

  // ─── Global Call Provider ──────────────────────────────────────────────────
  const { startCall, callState } = useCall();


  // ─── Data loading (use apiClient which auto-reads token from localStorage) ─
  const loadMembers = useCallback(async () => {
    try {
      const data = await apiClient('/api/family/members');
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load family members:', err);
      setError('Could not load family members');
    }
  }, []);

  const loadMemories = useCallback(async () => {
    if (!myProfileId) return;
    try {
      const data = await apiClient(`/api/family/memories?elderlyId=${myProfileId}`);
      setMemories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  }, [myProfileId]);

  const loadMessages = useCallback(async (contactId: string) => {
    try {
      const data = await apiClient(`/api/messages?contactId=${contactId}`);
      setChatMessages(Array.isArray(data) ? data : []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  const loadCallLogs = useCallback(async () => {
    try {
      const data = await apiClient('/api/calls');
      setCallLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load call logs:', err);
    }
  }, []);

  // Initial load — only after authenticated
  useEffect(() => {
    if (!isAuthenticated || !myProfileId) return;
    setLoading(true);
    Promise.all([loadMembers(), loadMemories(), loadCallLogs()])
      .finally(() => setLoading(false));
  }, [isAuthenticated, myProfileId, loadMembers, loadMemories, loadCallLogs]);

  // Load conversation when contact selected
  useEffect(() => {
    if (selectedContact) loadMessages(selectedContact.profileId);
  }, [selectedContact, loadMessages]);

  // Poll messages every 5s when in conversation
  useEffect(() => {
    if (!selectedContact) return;
    const interval = setInterval(() => loadMessages(selectedContact.profileId), 5000);
    return () => clearInterval(interval);
  }, [selectedContact, loadMessages]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ─── Photo upload ──────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async () => {
    if (!uploadPreview || !uploadTitle.trim()) {
      alert('Please enter a title for the photo.');
      return;
    }
    setUploading(true);
    try {
      await authFetch(`${API_BASE}/api/family/memories`, {
        method: 'POST',
        body: JSON.stringify({
          elderlyId: myProfileId,
          title: uploadTitle,
          description: uploadCaption,
          mediaBase64: uploadPreview,
          mediaType: 'image',
        }),
      });
      setUploadPreview(null);
      setUploadTitle('');
      setUploadCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadMemories();
    } catch {
      alert('Photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteMemory = async (id: string) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await authFetch(`${API_BASE}/api/family/memories/${id}`, { method: 'DELETE' });
      setMemories(prev => prev.filter(m => m.id !== id));
      if (lightboxIndex !== null && memories[lightboxIndex]?.id === id) setLightboxIndex(null);
    } catch {
      alert('Failed to delete photo.');
    }
  };

  // ─── Messaging ─────────────────────────────────────────────────────────────
  const sendChatMessage = async () => {
    if (!messageInput.trim() || !selectedContact) return;
    setSendingMsg(true);
    const content = messageInput.trim();
    setMessageInput('');
    try {
      const msg = await apiClient('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ receiverId: selectedContact.profileId, content }),
      });
      setChatMessages(prev => [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      alert('Failed to send message.');
    } finally {
      setSendingMsg(false);
    }
  };

  const displayName = (m: FamilyMember) =>
    m.preferredName || m.firstName + (m.lastName ? ` ${m.lastName}` : '');

  const memoryPhotoUrl = (url: string) =>
    url.startsWith('/api') ? `${API_BASE}${url}` : url;

  // ─── Auth guard ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <Users size={48} />
          <p>Please log in to access Family Connect.</p>
          <button className={styles.primaryBtn} onClick={() => router.push('/login')}>Log In</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* The global CallModal now handles Incoming and In-Call UI */}

      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className={styles.headerTitle}>
          <Users size={24} />
          <span>Family Connect</span>
        </div>
      </div>

      {/* ─── Tabs ─────────────────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        {([
          { id: 'contacts' as Tab, icon: <Phone size={16} />, label: '👨‍👩‍👦 Family' },
          { id: 'messages' as Tab, icon: <MessageCircle size={16} />, label: '💬 Messages' },
          { id: 'photos' as Tab, icon: <ImageIcon size={16} />, label: '📸 Memories' },
          { id: 'calls' as Tab, icon: <Clock size={16} />, label: '📞 Calls' },
        ]).map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
            onClick={() => { setActiveTab(t.id); if (t.id !== 'messages') setSelectedContact(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Loading ──────────────────────────────────────────────────────── */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading your family…</p>
        </div>
      )}

      {!loading && error && (
        <div className={styles.errorState}>
          <p>⚠️ {error}</p>
          <button className={styles.primaryBtn} onClick={() => { setError(''); loadMembers(); }}>
            Retry
          </button>
        </div>
      )}

      {/* ═══ CONTACTS TAB ════════════════════════════════════════════════════ */}
      {!loading && !error && activeTab === 'contacts' && (
        <div className={styles.contactsGrid}>
          {members.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={56} style={{ opacity: 0.25 }} />
              <p className={styles.emptyTitle}>No family members connected yet</p>
              <p className={styles.emptySubtitle}>
                Ask a family member to join Sahayak AI and connect with you.
              </p>
            </div>
          ) : members.map(m => (
            <div key={m.profileId} className={styles.contactCard}>
              <div className={styles.contactAvatar}>
                {m.avatarUrl
                  ? <img src={m.avatarUrl} alt={m.firstName} />
                  : <span className={styles.avatarInitial}>{m.firstName[0]}</span>}
              </div>
              <div className={styles.contactInfo}>
                <p className={styles.contactName}>{displayName(m)}</p>
                <p className={styles.contactRelation}>{m.relationshipType}</p>
              </div>
              <div className={styles.contactActions}>
                <button
                  className={`${styles.actionBtn} ${styles.callBtnAudio}`}
                  onClick={() => startCall(m.profileId, displayName(m), 'audio')}
                  disabled={callState !== 'idle'}
                >
                  <Phone size={18} /> Voice Call
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.callBtnVideo}`}
                  onClick={() => startCall(m.profileId, displayName(m), 'video')}
                  disabled={callState !== 'idle'}
                >
                  <Video size={18} /> Video Call
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.msgBtn}`}
                  onClick={() => { setSelectedContact(m); setActiveTab('messages'); }}
                >
                  <MessageCircle size={18} /> Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MESSAGES TAB ═════════════════════════════════════════════════════ */}
      {!loading && activeTab === 'messages' && (
        <div className={styles.messagesSection}>
          {!selectedContact ? (
            <div className={styles.contactsGrid}>
              {members.length === 0 ? (
                <div className={styles.emptyState}>
                  <MessageCircle size={56} style={{ opacity: 0.25 }} />
                  <p className={styles.emptyTitle}>No family members yet</p>
                </div>
              ) : members.map(m => (
                <div
                  key={m.profileId}
                  className={styles.contactCard}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedContact(m)}
                >
                  <div className={styles.contactAvatar}>
                    {m.avatarUrl
                      ? <img src={m.avatarUrl} alt={m.firstName} />
                      : <span className={styles.avatarInitial}>{m.firstName[0]}</span>}
                  </div>
                  <div className={styles.contactInfo}>
                    <p className={styles.contactName}>{displayName(m)}</p>
                    <p className={styles.contactRelation}>{m.relationshipType}</p>
                  </div>
                  <MessageCircle size={20} style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.conversationView}>
              <div className={styles.conversationHeader}>
                <button className={styles.backBtn} onClick={() => { setSelectedContact(null); setChatMessages([]); }}>
                  <ChevronLeft size={20} /> Back
                </button>
                <div className={styles.contactAvatar} style={{ width: 40, height: 40, fontSize: '1.2rem' }}>
                  {selectedContact.avatarUrl
                    ? <img src={selectedContact.avatarUrl} alt="" />
                    : <span className={styles.avatarInitial}>{selectedContact.firstName[0]}</span>}
                </div>
                <p className={styles.conversationName}>{displayName(selectedContact)}</p>
              </div>

              <div className={styles.messagesList}>
                {chatMessages.length === 0 && (
                  <div className={styles.emptyState} style={{ padding: '2rem' }}>
                    <MessageCircle size={40} style={{ opacity: 0.2 }} />
                    <p>No messages yet. Say hello! 👋</p>
                  </div>
                )}
                {chatMessages.map(msg => {
                  const isMine = msg.senderId === myProfileId;
                  return (
                    <div key={msg.id} className={`${styles.messageBubble} ${isMine ? styles.myMessage : styles.theirMessage}`}>
                      <p className={styles.messageContent}>{msg.content}</p>
                      <p className={styles.messageTime}>
                        {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        {isMine && (msg.read ? ' ✓✓' : ' ✓')}
                      </p>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className={styles.messageInputRow}>
                <input
                  type="text"
                  className={styles.messageInput}
                  placeholder={`Message ${selectedContact.firstName}…`}
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !sendingMsg && sendChatMessage()}
                />
                <button
                  className={styles.sendBtn}
                  onClick={sendChatMessage}
                  disabled={sendingMsg || !messageInput.trim()}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ PHOTOS TAB ═══════════════════════════════════════════════════════ */}
      {!loading && activeTab === 'photos' && (
        <div className={styles.photosSection}>
          {!uploadPreview ? (
            <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
              <Camera size={44} className={styles.uploadIcon} />
              <p className={styles.uploadText}>📷 Add a Family Memory</p>
              <p className={styles.uploadSubtext}>Tap to select a photo from your device</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className={styles.uploadPreview}>
              <img src={uploadPreview} alt="Preview" className={styles.previewImg} />
              <input
                type="text"
                placeholder="Title (required)…"
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                className={styles.captionInput}
              />
              <input
                type="text"
                placeholder="Caption (optional)…"
                value={uploadCaption}
                onChange={e => setUploadCaption(e.target.value)}
                className={styles.captionInput}
              />
              <div className={styles.uploadActions}>
                <button
                  className={styles.cancelUploadBtn}
                  onClick={() => { setUploadPreview(null); setUploadTitle(''); setUploadCaption(''); }}
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  className={styles.confirmUploadBtn}
                  onClick={uploadPhoto}
                  disabled={uploading || !uploadTitle.trim()}
                >
                  <Check size={16} /> {uploading ? 'Uploading…' : 'Save Photo'}
                </button>
              </div>
            </div>
          )}

          {memories.length === 0 ? (
            <div className={styles.emptyState} style={{ marginTop: '2rem' }}>
              <ImageIcon size={56} style={{ opacity: 0.2 }} />
              <p className={styles.emptyTitle}>No family memories yet</p>
              <p className={styles.emptySubtitle}>Add your first photo to start the album!</p>
            </div>
          ) : (
            <div className={styles.photosGrid}>
              {memories.map((photo, idx) => (
                <div key={photo.id} className={styles.photoCard} onClick={() => setLightboxIndex(idx)}>
                  <img
                    src={memoryPhotoUrl(photo.mediaUrl)}
                    alt={photo.title}
                    className={styles.photoImg}
                  />
                  <div className={styles.photoOverlay}>
                    <div>
                      <p className={styles.photoTitle}>{photo.title}</p>
                      {photo.description && <p className={styles.photoCaption}>{photo.description}</p>}
                      <p className={styles.photoMeta}>
                        By {photo.uploader?.firstName || 'Family'} •{' '}
                        {new Date(photo.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <button
                      className={styles.deletePhotoBtn}
                      onClick={e => { e.stopPropagation(); deleteMemory(photo.id); }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ CALL HISTORY TAB ══════════════════════════════════════════════════ */}
      {!loading && activeTab === 'calls' && (
        <div className={styles.callHistorySection}>
          {callLogs.length === 0 ? (
            <div className={styles.emptyState}>
              <Clock size={56} style={{ opacity: 0.2 }} />
              <p className={styles.emptyTitle}>No recent calls</p>
              <p className={styles.emptySubtitle}>Your call history will appear here.</p>
            </div>
          ) : callLogs.map(log => {
            const isCaller = log.callerId === myProfileId;
            const other = isCaller ? log.callee : log.caller;
            const statusColor = log.status === 'CONNECTED' || log.status === 'ENDED'
              ? '#4ade80' : log.status === 'MISSED' ? '#f87171' : 'rgba(255,255,255,0.4)';
            return (
              <div key={log.id} className={styles.callLogCard}>
                <div className={styles.contactAvatar} style={{ width: 48, height: 48 }}>
                  <span className={styles.avatarInitial}>{other?.firstName?.[0] || '?'}</span>
                </div>
                <div className={styles.callLogInfo}>
                  <p className={styles.callLogName}>{other?.firstName || 'Unknown'}</p>
                  <p className={styles.callLogMeta}>
                    {isCaller ? '📤 Outgoing' : '📥 Incoming'} •{' '}
                    <span style={{ color: statusColor }}>{log.status}</span>
                  </p>
                  <p className={styles.callLogTime}>
                    {new Date(log.startedAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  className={`${styles.actionBtn} ${styles.callBtnVideo}`}
                  style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem' }}
                  onClick={() => {
                    if (other?.id && other?.firstName) {
                      startCall(other.id, other.firstName, 'video');
                    }
                  }}
                  disabled={callState !== 'idle'}
                >
                  <Phone size={16} /> Call Back
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Lightbox ─────────────────────────────────────────────────────── */}
      {lightboxIndex !== null && memories[lightboxIndex] && (
        <div className={styles.lightbox} onClick={() => setLightboxIndex(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightboxIndex(null)}>
            <X size={24} />
          </button>
          {lightboxIndex > 0 && (
            <button
              className={styles.lightboxNav}
              style={{ left: '1rem' }}
              onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
            >
              <ChevronLeft size={28} />
            </button>
          )}
          <img
            src={memoryPhotoUrl(memories[lightboxIndex].mediaUrl)}
            alt={memories[lightboxIndex].title}
            className={styles.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
          <div className={styles.lightboxInfo} onClick={e => e.stopPropagation()}>
            <p className={styles.lightboxCaption}>{memories[lightboxIndex].title}</p>
            {memories[lightboxIndex].description && (
              <p className={styles.lightboxSubCaption}>{memories[lightboxIndex].description}</p>
            )}
            <p className={styles.lightboxMeta}>
              By {memories[lightboxIndex].uploader?.firstName || 'Family'} •{' '}
              {new Date(memories[lightboxIndex].createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
          {lightboxIndex < memories.length - 1 && (
            <button
              className={styles.lightboxNav}
              style={{ right: '1rem' }}
              onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Wrap in Suspense for Next.js compatibility
export default function FamilyConnectPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading Family Connect…</div>}>
      <FamilyConnectContent />
    </Suspense>
  );
}
