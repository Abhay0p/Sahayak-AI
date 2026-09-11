"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useAuth } from '@/components/AuthProvider/AuthProvider';
import { useCall } from '@/components/CallProvider/CallProvider';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Activity, AlertTriangle, ArrowLeft, Bell, Brain, Calendar, CheckCircle2, Clock, MessageSquare, Phone, Plus, Video, User, FileText } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { formatDateFriendly, formatDuration, formatScore } from '@/lib/formatting';

export default function PatientDetail({ params }: { params: { patientId: string } }) {
  const { session } = useAuth();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const unwrappedParams = React.use(params as any) as any;
  const patientId = unwrappedParams.patientId;
  const { startCall } = useCall();

  const [newNote, setNewNote] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['patientDetail', patientId],
    queryFn: async () => {
      const res = await apiClient(`/api/caregiver/patients/${patientId}`);
      return res.patient;
    },
    enabled: session.status === 'authenticated' && profile?.role === 'caregiver'
  });

  const createNoteMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiClient(`/api/caregiver/patients/${patientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      return res.note;
    },
    onSuccess: () => {
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: ['patientDetail', patientId] });
    }
  });

  const markRequestAcknowledged = useMutation({
    mutationFn: async (id: string) => {
      await apiClient(`/api/help/request/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACKNOWLEDGED' })
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patientDetail', patientId] })
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ routines, index }: { routines: any[], index: number }) => {
      const updatedStatus = routines[index].status === 'completed' ? 'pending' : 'completed';
      const res = await apiClient(`/api/caregiver/patients/${patientId}/routine`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routineIndex: index, status: updatedStatus })
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientDetail', patientId] });
      queryClient.invalidateQueries({ queryKey: ['caregiverDashboardData'] });
    }
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Activity className="animate-spin" size={48} style={{ opacity: 0.5 }} />
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem 3rem' }}>
          <AlertTriangle size={64} color="var(--danger-color)" />
          <h2>Error loading patient</h2>
          <Link href="/caregiver">Back to Dashboard</Link>
        </main>
      </div>
    );
  }

  const patient = data;
  const routines = patient.routines || [];
  const completedRoutines = routines.filter((r: any) => r.status === 'completed').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <Link href="/caregiver" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '50%', color: 'var(--text-primary)' }}>
            <ArrowLeft size={20} />
          </Link>
          {patient.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={patient.avatarUrl} alt={patient.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={32} />
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.2 }}>{patient.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Assigned Patient • {patient.languagePreference === 'en' ? 'English' : patient.languagePreference.toUpperCase()}</p>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => startCall(patientId, patient?.name || 'Patient', 'audio')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
            >
              <Phone size={18} /> Call
            </button>
            <button 
              onClick={() => startCall(patientId, patient?.name || 'Patient', 'video')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
            >
              <Video size={18} /> Video
            </button>
            <Link href="/messages" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>
              <MessageSquare size={18} /> Message
            </Link>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Attention Needed */}
            {patient.helpRequests && patient.helpRequests.filter((h: any) => h.status === 'CREATED' || h.status === 'SENT').length > 0 && (
              <section style={{ background: 'rgba(231, 76, 60, 0.1)', border: '2px solid var(--danger-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <h2 style={{ color: 'var(--danger-color)', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Bell size={20} /> ATTENTION NEEDED
                </h2>
                {patient.helpRequests.filter((h: any) => h.status === 'CREATED' || h.status === 'SENT').map((req: any) => (
                  <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--danger-color)' }}>{req.requestType.toUpperCase()} REQUEST</p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{formatDateFriendly(req.createdAt)} - "{req.message || 'Needs assistance'}"</p>
                    </div>
                    <button 
                      onClick={() => markRequestAcknowledged.mutate(req.id)}
                      style={{ background: 'var(--danger-color)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Acknowledge
                    </button>
                  </div>
                ))}
              </section>
            )}

            {/* Changes From Usual */}
            <section style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} color="var(--accent-color)" /> CHANGES FROM USUAL
              </h2>
              <p style={{ fontSize: '1.1rem', color: patient.changesFromUsual.includes('No significant') ? 'var(--success-color)' : 'var(--warning-color)', fontWeight: 500 }}>
                {patient.changesFromUsual}
              </p>
            </section>

            {/* Today's Care Plan */}
            <section style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={20} color="var(--accent-color)" /> TODAY'S CARE PLAN
                </h2>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{completedRoutines} / {routines.length} Completed</span>
              </div>
              
              {routines.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No routines configured.</p>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {routines.map((routine: any, idx: number) => {
                    const isDone = routine.status === 'completed';
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: isDone ? 'rgba(46, 204, 113, 0.05)' : 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{routine.time}</span>
                          <div>
                            <p style={{ fontWeight: 600, color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{routine.title}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{routine.category}</p>
                          </div>
                        </div>
                        <div>
                          {isDone ? (
                            <span style={{ color: 'var(--success-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={16} /> Completed</span>
                          ) : (
                            <button 
                              onClick={() => toggleTaskMutation.mutate({ routines, index: idx })}
                              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)' }}
                            >
                              Mark Done
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Care Notes */}
            <section style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="var(--accent-color)" /> CARE NOTES
              </h2>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                <input 
                  type="text" 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add an operational care note..." 
                  style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                  onKeyDown={e => { if (e.key === 'Enter' && newNote.trim()) createNoteMutation.mutate(newNote); }}
                />
                <button 
                  onClick={() => createNoteMutation.mutate(newNote)}
                  disabled={!newNote.trim() || createNoteMutation.isPending}
                  style={{ background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, opacity: !newNote.trim() ? 0.5 : 1 }}
                >
                  Save Note
                </button>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {patient.careNotes && patient.careNotes.length > 0 ? (
                  patient.careNotes.map((note: any) => (
                    <div key={note.id} style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--text-secondary)' }}>
                      <p style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.5 }}>"{note.text}"</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {formatDateFriendly(note.createdAt)} • By {note.author?.firstName || 'Caregiver'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No care notes yet.</p>
                )}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Appointments */}
            <section style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} color="var(--accent-color)" /> UPCOMING APPOINTMENTS
              </h2>
              {patient.appointments && patient.appointments.length > 0 ? (
                patient.appointments.map((apt: any) => (
                  <div key={apt.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: 600 }}>{apt.title}</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <Clock size={14} /> {formatDateFriendly(apt.scheduledAt)}
                    </p>
                    {apt.location && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>📍 {apt.location}</p>}
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No upcoming appointments.</p>
              )}
            </section>

            {/* Cognitive Activity */}
            <section style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Brain size={20} color="var(--accent-color)" /> COGNITIVE ACTIVITY
              </h2>
              {patient.gameSessions && patient.gameSessions.length > 0 ? (
                patient.gameSessions.map((sess: any) => (
                  <div key={sess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <p style={{ fontWeight: 600 }}>{sess.game?.name || 'Activity'}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDateFriendly(sess.createdAt)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{formatScore(sess.score)}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDuration(sess.durationSeconds)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No recent activity.</p>
              )}
            </section>

          </div>
        </div>

      </main>
    </div>
  );
}
