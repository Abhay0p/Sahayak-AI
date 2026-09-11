"use client";
import React from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useAuth } from '@/components/AuthProvider/AuthProvider';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Activity, AlertTriangle, Users, HeartPulse, Brain, Bell, ArrowRight, User, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export default function CaregiverPortal() {
  const { session } = useAuth();
  const { profile } = useUserProfile();

  const { data: caregiverData, isLoading, error } = useQuery({
    queryKey: ['caregiverDashboardData'],
    queryFn: async () => {
      const res = await apiClient('/api/caregiver');
      return res.data;
    },
    enabled: session.status === 'authenticated' && profile?.role === 'caregiver'
  });

  const hour = new Date().getHours();
  const greetingTime = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const caregiverName = profile?.firstName || session?.user?.email?.split('@')[0] || 'Caregiver';

  if (isLoading && session.status === 'authenticated') {
    return (
      <div className="flex min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)]">
        <Sidebar />
        <main className="flex-1 p-8 flex justify-center items-center">
          <div className="text-center text-white/50">
             <Activity className="animate-spin mx-auto mb-4" size={48} />
             <p className="text-lg font-medium">Loading your dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)]">
        <Sidebar />
        <main className="flex-1 p-8 flex flex-col justify-center items-center text-center">
          <AlertTriangle size={64} className="text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Failed to load dashboard</h2>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
          >
            Try Again
          </button>
        </main>
      </div>
    );
  }

  const { totalAssigned = 0, totalTasksToday = 0, totalTasksCompleted = 0, totalActiveHelpRequests = 0, requiringAttention = 0, appointmentsToday = 0, patients = [] } = caregiverData || {};

  return (
    <div className="flex min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-bold mb-2 tracking-tight">{greetingTime}, <span className="text-purple-400">{caregiverName}</span></h1>
          <p className="text-white/60 text-lg">Your Care Coordination Dashboard</p>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col">
            <h3 className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><Users size={16} /> Assigned</h3>
            <p className="text-4xl font-bold mt-auto">{totalAssigned}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col">
            <h3 className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><Clock size={16} /> Tasks Today</h3>
            <p className="text-4xl font-bold mt-auto">{totalTasksToday}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col">
            <h3 className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><CheckCircle2 size={16} /> Completed</h3>
            <p className="text-4xl font-bold mt-auto text-green-400">{totalTasksCompleted}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col">
            <h3 className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2"><Calendar size={16} /> Appointments</h3>
            <p className="text-4xl font-bold mt-auto text-blue-400">{appointmentsToday}</p>
          </div>
          <div className={`bg-white/5 backdrop-blur-md rounded-2xl p-6 flex flex-col ${totalActiveHelpRequests > 0 ? 'border-2 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border border-white/10'}`}>
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2 ${totalActiveHelpRequests > 0 ? 'text-red-400' : 'text-white/50'}`}>
              <AlertTriangle size={16} /> SOS / Help
            </h3>
            <p className={`text-4xl font-bold mt-auto ${totalActiveHelpRequests > 0 ? 'text-red-400' : 'text-white'}`}>{totalActiveHelpRequests}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="text-purple-400" /> Assigned Patients</h2>
        </div>

        {patients.length === 0 ? (
          <div className="py-16 text-center bg-white/5 border border-white/10 rounded-2xl">
             <Users size={64} className="mx-auto mb-4 text-white/20" />
             <h2 className="text-2xl font-semibold mb-2">No assigned patients</h2>
             <p className="text-white/50">You do not have any patients assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {patients.map((p: any) => (
              <div key={p.id} className={`group bg-white/5 backdrop-blur-md rounded-2xl p-6 flex flex-col transition-all hover:bg-white/10 ${p.statusColor === 'danger' ? 'border-2 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : p.statusColor === 'warning' ? 'border-2 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border border-white/10'}`}>
                <div className="flex items-center gap-4 mb-6">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.name} className="w-16 h-16 rounded-full object-cover border-2 border-white/10" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white border-2 border-white/10">
                      <User size={32} />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-white/60 bg-black/20 px-2 py-1 rounded-md">
                        {p.languagePreference === 'en' ? 'English' : p.languagePreference.toUpperCase()}
                      </span>
                      {p.statusColor === 'danger' && <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-md flex items-center gap-1"><AlertTriangle size={12}/> SOS</span>}
                    </div>
                  </div>
                </div>

                <div className="mb-6 bg-black/20 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60 font-medium">Today's Tasks</span>
                    <span className="font-bold">{p.tasksCompleted} / {p.tasksToday}</span>
                  </div>
                  {p.tasksToday > 0 ? (
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${p.statusColor === 'danger' ? 'bg-red-500' : p.tasksCompleted === p.tasksToday ? 'bg-green-500' : 'bg-purple-500'}`} 
                        style={{ width: `${(p.tasksCompleted / p.tasksToday) * 100}%` }} 
                      />
                    </div>
                  ) : (
                     <div className="text-xs text-white/40 italic">No tasks scheduled today</div>
                  )}
                </div>

                {p.alerts && p.alerts.length > 0 && (
                  <div className="bg-red-500/10 border-l-4 border-red-500 p-3 rounded-r-lg mb-6">
                    <p className="text-red-400 font-bold text-sm flex items-center gap-2 mb-1">
                      <Bell size={14} /> Attention Required
                    </p>
                    <p className="text-red-200 text-sm leading-snug">{p.alerts[0]}</p>
                  </div>
                )}
                
                {p.missedTasks > 0 && p.alerts.length === 0 && (
                  <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-3 rounded-r-lg mb-6">
                    <p className="text-yellow-400 font-bold text-sm flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} /> Missed Tasks
                    </p>
                    <p className="text-yellow-200 text-sm leading-snug">{p.missedTasks} routines appear missed.</p>
                  </div>
                )}

                <div className="mt-auto pt-4 flex gap-2">
                  <Link 
                    href={`/caregiver/patients/${p.id}`} 
                    className="flex-1 bg-white/10 hover:bg-purple-600 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors border border-white/5"
                  >
                    View Details <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
