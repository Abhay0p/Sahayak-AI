"use client";
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useAuth } from '@/components/AuthProvider/AuthProvider';
import { Users, Shield, Database, Activity, LayoutDashboard, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export default function AdminPortal() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await apiClient('/api/admin');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const result = await res.json();
      return result.data || {};
    },
    enabled: session.status === 'authenticated'
  });

  if (loading && session.status === 'authenticated') {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading system data...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>System Administration</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Global Platform Management & Security Audit</p>
        </header>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          {['overview', 'users', 'roles & permissions', 'games configuration', 'system health'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 1rem',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: activeTab === tab ? 'var(--accent-color)' : 'var(--text-secondary)',
                cursor: 'pointer',
                position: 'relative',
                textTransform: 'capitalize'
              }}
            >
              {tab}
              {activeTab === tab && (
                <span style={{ position: 'absolute', bottom: '-0.6rem', left: 0, right: 0, height: '3px', background: 'var(--accent-color)', borderRadius: '3px 3px 0 0' }} />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && stats && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={32} style={{ color: 'var(--accent-color)', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Total Users</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.totalUsers || 0}</p>
              </div>

              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={32} style={{ color: 'var(--success-color)', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Elderly Patients</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.elderlyCount || 0}</p>
              </div>

              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={32} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Caregivers & Med</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 700 }}>{(stats.caregiverCount || 0) + (stats.healthcareCount || 0)}</p>
              </div>
              
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={32} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Total Games Played</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.totalGameSessions || 0}</p>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
               <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>System Status</h2>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success-color)' }}></div>
                 <span>Database Connected</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success-color)' }}></div>
                 <span>Authentication Service Online</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success-color)' }}></div>
                 <span>File Storage Accessible</span>
               </div>
            </div>
          </div>
        )}

        {activeTab !== 'overview' && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Settings size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>Administration module: {activeTab} is currently in View-Only mode for the demo.</p>
          </div>
        )}
      </main>
    </div>
  );
}
