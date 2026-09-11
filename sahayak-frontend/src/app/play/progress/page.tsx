"use client";
import React from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { ArrowLeft, TrendingUp, Award, Clock, Target } from 'lucide-react';
import styles from './page.module.css'; // Let's use a generic inline style or a new module

export default function ProgressPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link href="/play" style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </Link>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>Cognitive Progress</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--success-color)' }}>
              <TrendingUp size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Current Streak</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>7 Days</p>
          </div>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--accent-color)' }}>
              <Target size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Avg. Accuracy</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>85%</p>
          </div>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#f59e0b' }}>
              <Award size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Total Score</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>12,450</p>
          </div>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#3b82f6' }}>
              <Clock size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Time Played</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>4.5 hrs</p>
          </div>
        </div>

        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Recent Activity</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { game: 'Memory Match', score: 850, accuracy: '90%', date: 'Today, 2:30 PM', color: '#a855f7' },
            { game: 'Spot the Difference', score: 620, accuracy: '80%', date: 'Today, 10:15 AM', color: '#3b82f6' },
            { game: 'Number Recall', score: 450, accuracy: '75%', date: 'Yesterday', color: '#10b981' },
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: item.color }} />
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{item.game}</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>{item.date}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-color)' }}>{item.score} pts</p>
                <p style={{ color: 'var(--text-secondary)' }}>{item.accuracy} accuracy</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
