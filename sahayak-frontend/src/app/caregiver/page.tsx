"use client";
import React from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useAuth } from '@/components/AuthProvider/AuthProvider';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Activity, AlertTriangle, Users, HeartPulse, Brain, Bell, ArrowRight, User } from 'lucide-react';
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
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
             <Activity className="animate-spin" size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
             <p>Loading your dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <AlertTriangle size={64} color="var(--danger-color)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Failed to load dashboard</h2>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '0.75rem 1.5rem', background: 'var(--accent-color)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Try Again
          </button>
        </main>
      </div>
    );
  }

  const { totalAssigned = 0, totalTasksToday = 0, totalTasksCompleted = 0, totalActiveHelpRequests = 0, requiringAttention = 0, patients = [] } = caregiverData || {};

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>{greetingTime}, {caregiverName}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Your Care Coordination Dashboard</p>
        </header>

        {/* Summary Stats */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '150px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Patients</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: 'auto' }}>{totalAssigned}</p>
          </div>
          <div style={{ flex: 1, minWidth: '150px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Tasks Today</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: 'auto' }}>{totalTasksToday}</p>
          </div>
          <div style={{ flex: 1, minWidth: '150px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Completed</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: 'auto', color: 'var(--success-color)' }}>{totalTasksCompleted}</p>
          </div>
          <div style={{ flex: 1, minWidth: '150px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Needs Attention</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: 'auto', color: requiringAttention > 0 ? 'var(--warning-color)' : 'var(--text-primary)' }}>{requiringAttention}</p>
          </div>
          <div style={{ flex: 1, minWidth: '150px', background: 'var(--card-bg)', border: requiringAttention > 0 ? '2px solid var(--danger-color)' : '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: requiringAttention > 0 ? 'var(--danger-color)' : 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase' }}>Active SOS / Help</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: 'auto', color: totalActiveHelpRequests > 0 ? 'var(--danger-color)' : 'var(--text-primary)' }}>{totalActiveHelpRequests}</p>
          </div>
        </div>

        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', fontWeight: 700 }}>Assigned Patients</h2>

        {patients.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
             <Users size={64} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)', opacity: 0.5 }} />
             <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No assigned patients</h2>
             <p style={{ color: 'var(--text-secondary)' }}>You do not have any patients assigned to you yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {patients.map((p: any) => (
              <div key={p.id} style={{ background: 'var(--card-bg)', border: p.statusColor === 'danger' ? '2px solid var(--danger-color)' : p.statusColor === 'warning' ? '2px solid var(--warning-color)' : '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  {p.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatarUrl} alt={p.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={32} />
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{p.name}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {p.languagePreference === 'en' ? 'English' : p.languagePreference.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Today's Tasks</span>
                    <span style={{ fontWeight: 600 }}>{p.tasksCompleted} / {p.tasksToday}</span>
                  </div>
                  {p.tasksToday > 0 && (
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(p.tasksCompleted / p.tasksToday) * 100}%`, background: p.statusColor === 'danger' ? 'var(--danger-color)' : p.tasksCompleted === p.tasksToday ? 'var(--success-color)' : 'var(--accent-color)' }} />
                    </div>
                  )}
                </div>

                {p.alerts && p.alerts.length > 0 && (
                  <div style={{ background: 'rgba(231, 76, 60, 0.1)', borderLeft: '4px solid var(--danger-color)', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
                    <p style={{ color: 'var(--danger-color)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Bell size={16} /> Attention Required
                    </p>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{p.alerts[0]}</p>
                  </div>
                )}
                
                {p.missedTasks > 0 && p.alerts.length === 0 && (
                  <div style={{ background: 'rgba(241, 196, 15, 0.1)', borderLeft: '4px solid var(--warning-color)', padding: '0.75rem 1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
                    <p style={{ color: 'var(--warning-color)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={16} /> Missed Tasks
                    </p>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{p.missedTasks} routines appear missed.</p>
                  </div>
                )}

                <Link href={`/caregiver/patients/${p.id}`} style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', background: 'var(--bg-color)', color: 'var(--text-primary)', textDecoration: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, border: '1px solid var(--border-color)' }}>
                  View Patient <ArrowRight size={18} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
