"use client";
import React from 'react';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useAuth } from '@/components/AuthProvider/AuthProvider';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Activity, AlertTriangle, Users, ChevronRight, Heart, Brain, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';

interface PatientSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  statusColor: 'success' | 'warning' | 'danger';
  alerts: string[];
  todaysActivity: { medicine: string };
  cognitiveActivity: { score: number; completedAt: string }[];
}

interface DashboardData {
  totalAssigned: number;
  requiringAttention: number;
  appointmentsToday: number;
  patients: PatientSummary[];
}

export default function HealthcarePortal() {
  const { session } = useAuth();
  const { profile } = useUserProfile();

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['healthcareData'],
    queryFn: async () => {
      // apiClient auto-throws on error and returns parsed JSON
      const result = await apiClient('/api/healthcare');
      return result.data as DashboardData;
    },
    enabled: session.status === 'authenticated',
    retry: 1,
  });

  const doctorName = profile?.lastName
    ? `Dr. ${profile.lastName}`
    : (profile?.firstName || 'Doctor');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
          <Activity className="animate-spin" size={48} style={{ opacity: 0.5, color: 'var(--accent-color)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Loading healthcare dashboard…</p>
        </main>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--danger-color)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Unable to load dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>
            We couldn't load the healthcare data right now. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '0.5rem',
              padding: '0.75rem 2rem',
              background: 'var(--accent-color)',
              color: '#fff',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Retry
          </button>
          {process.env.NODE_ENV === 'development' && error && (
            <pre style={{ fontSize: '0.75rem', color: 'var(--danger-color)', opacity: 0.7, marginTop: '1rem', maxWidth: '600px', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
              {String(error)}
            </pre>
          )}
        </main>
      </div>
    );
  }

  const statusConfig = {
    success: { label: 'Active',    color: 'var(--success-color)' },
    warning: { label: 'Monitor',   color: '#f39c12' },
    danger:  { label: 'Attention', color: 'var(--danger-color)' },
  };

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>

        {/* Header */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 700, margin: 0 }}>
            {greeting}, {doctorName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.3rem' }}>
            Healthcare Dashboard
          </p>

          {/* Summary stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.25rem',
            marginTop: '1.75rem',
          }}>
            {[
              {
                icon: <Users size={22} />,
                label: 'Assigned Patients',
                value: data.totalAssigned,
                color: 'var(--accent-color)',
              },
              {
                icon: <AlertTriangle size={22} />,
                label: 'Requiring Attention',
                value: data.requiringAttention,
                color: data.requiringAttention > 0 ? 'var(--danger-color)' : 'var(--success-color)',
              },
              {
                icon: <Heart size={22} />,
                label: "Today\u2019s Activity",
                value: data.appointmentsToday,
                color: 'var(--success-color)',
              },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div style={{ color: stat.color, opacity: 0.9 }}>{stat.icon}</div>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: '1.9rem', fontWeight: 800, color: stat.color, margin: '0.1rem 0 0' }}>
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </header>

        {/* Patient Roster */}
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Patient Roster
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '1.5rem',
        }}>
          {data.patients.map((patient) => {
            const sc = statusConfig[patient.statusColor] || statusConfig.success;
            const lastScore = patient.cognitiveActivity?.[0]?.score;

            return (
              <div
                key={patient.id}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {/* Patient header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {patient.avatarUrl ? (
                      <img
                        src={patient.avatarUrl}
                        alt={patient.name}
                        style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: 46, height: 46, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', fontWeight: 700, color: '#fff',
                      }}>
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{patient.name}</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0', fontFamily: 'monospace' }}>
                        ID: {patient.id.substring(0, 8)}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: sc.color, display: 'inline-block' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: sc.color }}>{sc.label}</span>
                  </div>
                </div>

                {/* Alerts */}
                {patient.alerts && patient.alerts.length > 0 && (
                  <div style={{
                    background: 'rgba(231,76,60,0.06)',
                    border: '1px solid rgba(231,76,60,0.2)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                  }}>
                    {patient.alerts.map((a, i) => (
                      <p key={i} style={{ color: 'var(--danger-color)', fontSize: '0.83rem', fontWeight: 500, margin: '0.2rem 0' }}>
                        ⚠ {a}
                      </p>
                    ))}
                  </div>
                )}

                {/* Mini stats */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{
                    flex: 1,
                    background: 'var(--bg-color)',
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Heart size={12} /> Adherence
                    </p>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: '0.25rem 0 0' }}>
                      {patient.todaysActivity?.medicine === 'All caught up' ? '✓ OK' : 'Pending'}
                    </p>
                  </div>
                  <div style={{
                    flex: 1,
                    background: 'var(--bg-color)',
                    padding: '0.7rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Brain size={12} /> Cognitive
                    </p>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-color)', margin: '0.25rem 0 0' }}>
                      {lastScore != null ? `${lastScore} pts` : 'No data'}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={`/healthcare/patients/${patient.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem',
                    background: 'var(--accent-color)',
                    color: '#fff',
                    borderRadius: '10px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    marginTop: 'auto',
                    transition: 'opacity 0.2s',
                  }}
                >
                  View Clinical Details <ChevronRight size={18} />
                </Link>
              </div>
            );
          })}

          {data.patients.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              padding: '4rem 2rem',
              textAlign: 'center',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
            }}>
              <Users size={52} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)', opacity: 0.25, display: 'block' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
                No patients currently assigned to your care list.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
