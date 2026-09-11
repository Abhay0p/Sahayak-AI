"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useAuth } from '@/components/AuthProvider/AuthProvider';
import { useCall } from '@/components/CallProvider/CallProvider';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Activity, AlertTriangle, ArrowLeft, Bell, Brain, Calendar, CheckCircle2, Clock, MessageSquare, Phone, Plus, Video, User, FileText, Check } from 'lucide-react';
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
      <div className="flex min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)]">
        <Sidebar />
        <main className="flex-1 p-8 flex justify-center items-center">
          <Activity className="animate-spin text-white/50" size={48} />
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)]">
        <Sidebar />
        <main className="flex-1 p-8 flex flex-col justify-center items-center text-center">
          <AlertTriangle size={64} className="text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Error loading patient</h2>
          <Link href="/caregiver" className="text-purple-400 hover:text-purple-300 font-medium">Back to Dashboard</Link>
        </main>
      </div>
    );
  }

  const patient = data;
  const routines = patient.routines || [];
  const completedRoutines = routines.filter((r: any) => r.status === 'completed').length;

  return (
    <div className="flex min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* Header */}
        <header className="flex items-center gap-6 mb-10 pb-6 border-b border-white/10">
          <Link href="/caregiver" className="flex items-center justify-center w-12 h-12 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition">
            <ArrowLeft size={20} />
          </Link>
          {patient.avatarUrl ? (
            <img src={patient.avatarUrl} alt={patient.name} className="w-20 h-20 rounded-full object-cover border-2 border-white/10" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/10">
              {patient.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">{patient.name}</h1>
            <p className="text-white/50 text-lg">
              Assigned Patient • {patient.languagePreference === 'en' ? 'English' : patient.languagePreference.toUpperCase()}
            </p>
          </div>

          <div className="ml-auto flex gap-3">
            <button 
              onClick={() => startCall(patientId, patient?.name || 'Patient', 'audio')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition"
            >
              <Phone size={18} className="text-green-400" /> Call
            </button>
            <button 
              onClick={() => startCall(patientId, patient?.name || 'Patient', 'video')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition"
            >
              <Video size={18} className="text-blue-400" /> Video
            </button>
            <Link 
              href="/messages" 
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition"
            >
              <MessageSquare size={18} /> Message
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column (2/3 width) */}
          <div className="xl:col-span-2 flex flex-col gap-8">
            
            {/* Attention Needed */}
            {patient.helpRequests && patient.helpRequests.filter((h: any) => h.status === 'CREATED' || h.status === 'SENT').length > 0 && (
              <section className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-6 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <h2 className="text-red-400 text-xl font-bold flex items-center gap-2 mb-4">
                  <Bell size={24} /> ATTENTION NEEDED
                </h2>
                <div className="space-y-3">
                  {patient.helpRequests.filter((h: any) => h.status === 'CREATED' || h.status === 'SENT').map((req: any) => (
                    <div key={req.id} className="flex justify-between items-center bg-black/30 p-4 rounded-xl">
                      <div>
                        <p className="font-bold text-red-400 mb-1">{req.requestType.toUpperCase()} REQUEST</p>
                        <p className="text-white/70">{formatDateFriendly(req.createdAt)} - "{req.message || 'Needs assistance'}"</p>
                      </div>
                      <button 
                        onClick={() => markRequestAcknowledged.mutate(req.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition shadow-lg"
                      >
                        Acknowledge
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Changes From Usual */}
            <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Activity size={24} className="text-purple-400" /> CHANGES FROM USUAL
              </h2>
              <div className={`p-4 rounded-xl bg-black/20 border-l-4 ${patient.changesFromUsual.includes('No significant') ? 'border-green-500' : 'border-yellow-500'}`}>
                <p className={`text-lg font-medium ${patient.changesFromUsual.includes('No significant') ? 'text-green-400' : 'text-yellow-400'}`}>
                  {patient.changesFromUsual}
                </p>
              </div>
            </section>

            {/* Today's Care Plan */}
            <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle2 size={24} className="text-purple-400" /> TODAY'S CARE PLAN
                </h2>
                <span className="font-bold text-white/60 bg-black/20 px-4 py-1.5 rounded-full">{completedRoutines} / {routines.length} Completed</span>
              </div>
              
              {routines.length === 0 ? (
                <div className="p-8 text-center bg-black/20 rounded-xl border border-white/5">
                   <CheckCircle2 className="mx-auto mb-2 text-white/20" size={32} />
                   <p className="text-white/50 italic">No routines configured for today.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {routines.map((routine: any, idx: number) => {
                    const isDone = routine.status === 'completed';
                    return (
                      <div key={idx} className={`flex justify-between items-center p-4 border rounded-xl transition-all ${isDone ? 'bg-green-500/5 border-green-500/20' : 'bg-black/20 border-white/5 hover:border-white/20'}`}>
                        <div className="flex items-center gap-4">
                          <span className={`text-lg font-bold w-20 ${isDone ? 'text-white/40' : 'text-purple-400'}`}>{routine.time}</span>
                          <div>
                            <p className={`font-bold text-lg ${isDone ? 'text-white/40 line-through' : 'text-white'}`}>{routine.title}</p>
                            <p className={`text-sm ${isDone ? 'text-white/30' : 'text-white/50'}`}>{routine.category}</p>
                          </div>
                        </div>
                        <div>
                          {isDone ? (
                            <span className="text-green-400 font-bold flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg"><Check size={18} /> Completed</span>
                          ) : (
                            <button 
                              onClick={() => toggleTaskMutation.mutate({ routines, index: idx })}
                              className="bg-white/10 hover:bg-purple-600 border border-white/10 px-5 py-2 rounded-lg font-bold transition-all"
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
            <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText size={24} className="text-purple-400" /> CARE NOTES
              </h2>

              <div className="flex gap-3 mb-8">
                <input 
                  type="text" 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type an operational care note..." 
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 transition"
                  onKeyDown={e => { if (e.key === 'Enter' && newNote.trim()) createNoteMutation.mutate(newNote); }}
                />
                <button 
                  onClick={() => createNoteMutation.mutate(newNote)}
                  disabled={!newNote.trim() || createNoteMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-bold transition whitespace-nowrap"
                >
                  Save Note
                </button>
              </div>

              <div className="space-y-4">
                {patient.careNotes && patient.careNotes.length > 0 ? (
                  patient.careNotes.map((note: any) => (
                    <div key={note.id} className="bg-black/20 p-5 rounded-xl border-l-4 border-purple-500">
                      <p className="text-white text-lg mb-2 leading-relaxed">"{note.text}"</p>
                      <p className="text-sm text-white/50 font-medium">
                        {formatDateFriendly(note.createdAt)} • By {note.author?.firstName || 'Caregiver'} {note.author?.lastName || ''}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center bg-black/20 rounded-xl border border-white/5">
                     <FileText className="mx-auto mb-2 text-white/20" size={24} />
                     <p className="text-white/50 italic">No care notes yet.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column (1/3 width) */}
          <div className="flex flex-col gap-8">
            
            {/* Appointments */}
            <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Calendar size={24} className="text-purple-400" /> APPOINTMENTS
              </h2>
              {patient.appointments && patient.appointments.length > 0 ? (
                <div className="space-y-3">
                  {patient.appointments.map((apt: any) => (
                    <div key={apt.id} className="bg-black/20 p-4 border border-white/5 rounded-xl">
                      <p className="font-bold text-lg mb-2">{apt.title}</p>
                      <p className="text-sm text-white/70 flex items-center gap-2 mb-1">
                        <Clock size={14} className="text-purple-400" /> {formatDateFriendly(apt.scheduledAt)}
                      </p>
                      {apt.location && <p className="text-sm text-white/70 flex items-center gap-2">📍 {apt.location}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-black/20 rounded-xl border border-white/5">
                   <Calendar className="mx-auto mb-2 text-white/20" size={24} />
                   <p className="text-white/50 italic">No upcoming appointments.</p>
                </div>
              )}
            </section>

            {/* Cognitive Activity */}
            <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Brain size={24} className="text-purple-400" /> COGNITIVE ACTIVITY
              </h2>
              {patient.gameSessions && patient.gameSessions.length > 0 ? (
                <div className="space-y-1">
                  {patient.gameSessions.map((sess: any) => (
                    <div key={sess.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                      <div>
                        <p className="font-bold">{sess.game?.name || 'Activity'}</p>
                        <p className="text-xs text-white/50 mt-1">{formatDateFriendly(sess.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">{formatScore(sess.score)}</p>
                        <p className="text-xs text-white/50 mt-1">{formatDuration(sess.durationSeconds)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-black/20 rounded-xl border border-white/5">
                   <Brain className="mx-auto mb-2 text-white/20" size={24} />
                   <p className="text-white/50 italic">No recent cognitive activity.</p>
                </div>
              )}
            </section>

          </div>
        </div>

      </main>
    </div>
  );
}
