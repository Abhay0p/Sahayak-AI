"use client";
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useAuth } from '@/components/AuthProvider/AuthProvider';
import {
  Activity, AlertTriangle, ArrowLeft, Brain,
  Heart, FileText, Bell
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useCall } from '@/components/CallProvider/CallProvider';

interface PatientDetail {
  id: string;
  name: string;
  preferredName?: string;
  avatarUrl?: string;
  languagePreference?: string;
  routines: { title: string; time?: string; type?: string; status?: string }[];
  clinicalDetails: string | null;
  changesFromUsual: string;
  appointments: { id: string; title: string; scheduledAt: string }[];
  careNotes: { id: string; content: string; createdAt: string; author: { firstName: string; lastName: string; role: string } }[];
  cognitiveActivity: { completedAt: string; challengeType?: string }[];
  gameSessions: { id: string; score: number; createdAt: string; game: { name: string } }[];
  helpRequests: { id: string; requestType: string; message?: string; status: string; createdAt: string }[];
  recentNotifications: { id: string; title: string; body: string; createdAt: string; read: boolean }[];
}

export default function PatientDetailPage({ params }: { params: { patientId: string } }) {
  const unwrappedParams = React.use(params as any) as any;
  const patientId = unwrappedParams.patientId;
  const router = useRouter();
  const { session } = useAuth();
  const { startCall } = useCall();

  const { data, isLoading, error } = useQuery<PatientDetail>({
    queryKey: ['patientDetail', patientId],
    queryFn: async () => {
      const result = await apiClient(`/api/healthcare/patients/${patientId}`);
      return result.patient as PatientDetail;
    },
    enabled: !!patientId && session.status === 'authenticated',
    retry: 1,
  });

  const sectionStyle: React.CSSProperties = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
          <Activity className="animate-spin" size={44} style={{ color: 'var(--accent-color)', opacity: 0.6 }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading patient details…</p>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--danger-color)" />
          <h2 style={{ margin: 0 }}>Patient Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 380 }}>
            This patient record could not be loaded. You may not have authorization, or the record does not exist.
          </p>
          <button
            onClick={() => router.push('/healthcare')}
            style={{ padding: '0.75rem 2rem', background: 'var(--accent-color)', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            ← Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  const avgScore = data.gameSessions && data.gameSessions.length > 0
    ? Math.round(data.gameSessions.reduce((s, a) => s + a.score, 0) / data.gameSessions.length)
    : null;

  const activeAlerts = data.helpRequests.filter(h => ['CREATED', 'SENT'].includes(h.status));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>

        <button
          onClick={() => router.push('/healthcare')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.95rem', cursor: 'pointer', marginBottom: '1.5rem', padding: 0 }}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        {/* Patient Header */}
        <div style={{ ...sectionStyle, display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt={data.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {data.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{data.name}</h1>
            {data.preferredName && <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>Preferred: {data.preferredName}</p>}
            <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0 0', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              ID: {data.id} · Language: {data.languagePreference || 'en'}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Avg. Score</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-color)', margin: '0.1rem 0 0' }}>{avgScore ?? '—'}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>Active Alerts</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, color: activeAlerts.length > 0 ? 'var(--danger-color)' : 'var(--success-color)', margin: '0.1rem 0 0' }}>{activeAlerts.length}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            onClick={() => startCall(patientId, data.name, 'audio')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
          >
            📞 Audio Call
          </button>
          <button 
            onClick={() => startCall(patientId, data.name, 'video')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
          >
            📹 Video Call
          </button>
          <button 
            onClick={() => router.push('/messages')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
          >
            💬 Message
          </button>
        </div>

        {/* Changes From Usual */}
        {data.changesFromUsual && (
          <div style={{ ...sectionStyle, borderColor: 'var(--accent-color)', background: 'rgba(139,92,246,0.04)' }}>
            <h2 style={{ ...headingStyle, color: 'var(--accent-color)' }}><Activity size={18} /> Changes From Usual</h2>
            <p style={{ margin: 0, fontWeight: 500 }}>{data.changesFromUsual}</p>
          </div>
        )}

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div style={{ ...sectionStyle, borderColor: 'rgba(231,76,60,0.3)', background: 'rgba(231,76,60,0.04)' }}>
            <h2 style={{ ...headingStyle, color: 'var(--danger-color)' }}><AlertTriangle size={18} /> Active Alerts ({activeAlerts.length})</h2>
            {activeAlerts.map(h => (
              <div key={h.id} style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(231,76,60,0.08)', marginBottom: '0.5rem', border: '1px solid rgba(231,76,60,0.15)' }}>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--danger-color)' }}>{h.requestType}</p>
                {h.message && <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{h.message}</p>}
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{new Date(h.createdAt).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        )}

        {/* Cognitive Activity (Game Sessions) */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}><Brain size={18} color="var(--accent-color)" /> Cognitive Activity (Last {data.gameSessions?.length || 0} sessions)</h2>
          {!data.gameSessions || data.gameSessions.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No game activity recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.gameSessions.map((s) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.game.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '0.75rem' }}>
                      {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: s.score >= 70 ? 'var(--success-color)' : s.score >= 40 ? '#f39c12' : 'var(--danger-color)' }}>
                    {s.score} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Routines */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}><Heart size={18} color="var(--success-color)" /> Daily Routine Plan</h2>
          {data.routines.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No routine configured for this patient.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {data.routines.map((r, i) => (
                <div key={i} style={{ padding: '0.85rem 1rem', background: 'var(--bg-color)', borderRadius: '10px', border: '1px solid var(--border-color)', opacity: r.status === 'completed' ? 0.6 : 1 }}>
                  <p style={{ fontWeight: 600, margin: 0, textDecoration: r.status === 'completed' ? 'line-through' : 'none' }}>{r.title}</p>
                  {r.time && <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0 0', fontSize: '0.8rem' }}>🕐 {r.time} • {r.status === 'completed' ? '✓ Completed' : 'Pending'}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}><Bell size={18} color="#8b5cf6" /> Recent Notifications</h2>
          {data.recentNotifications.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No recent notifications.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.recentNotifications.map(n => (
                <div key={n.id} style={{ padding: '0.75rem 1rem', background: 'var(--bg-color)', borderRadius: '8px', border: `1px solid ${n.read ? 'var(--border-color)' : 'rgba(139,92,246,0.3)'}`, opacity: n.read ? 0.75 : 1 }}>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{n.title}</p>
                  <p style={{ color: 'var(--text-secondary)', margin: '0.15rem 0 0', fontSize: '0.85rem' }}>{n.body}</p>
                  <p style={{ color: 'var(--text-secondary)', margin: '0.15rem 0 0', fontSize: '0.75rem' }}>{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Request History */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}><FileText size={18} color="#f39c12" /> Help Request History</h2>
          {data.helpRequests.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No help requests recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.helpRequests.map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{h.requestType}</p>
                    {h.message && <p style={{ color: 'var(--text-secondary)', margin: '0.1rem 0 0', fontSize: '0.85rem' }}>{h.message}</p>}
                    <p style={{ color: 'var(--text-secondary)', margin: '0.1rem 0 0', fontSize: '0.75rem' }}>{new Date(h.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 700, background: h.status === 'RESOLVED' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)', color: h.status === 'RESOLVED' ? 'var(--success-color)' : 'var(--danger-color)' }}>
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clinical Details */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>📋 Clinical Details</h2>
          {data.clinicalDetails ? (
            <p style={{ margin: 0 }}>{data.clinicalDetails}</p>
          ) : (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Clinical details not recorded.</p>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>📅 Upcoming Appointments</h2>
          {!data.appointments || data.appointments.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0', margin: 0 }}>No upcoming appointments.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
              {data.appointments.map(a => (
                <div key={a.id} style={{ padding: '0.85rem 1rem', background: 'var(--bg-color)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>{a.title}</p>
                  <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0 0', fontSize: '0.85rem' }}>{new Date(a.scheduledAt).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Care Notes */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>📝 Care Notes</h2>
          {!data.careNotes || data.careNotes.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0', margin: 0 }}>No care notes recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.careNotes.map(n => (
                <div key={n.id} style={{ padding: '0.85rem 1rem', background: 'var(--bg-color)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <p style={{ margin: '0 0 0.5rem' }}>{n.content}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      By {n.author.firstName} {n.author.lastName} ({n.author.role})
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(n.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
