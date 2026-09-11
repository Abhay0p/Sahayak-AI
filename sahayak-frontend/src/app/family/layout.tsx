"use client";
import React from 'react';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import PushPermissionRequest from '@/app/family/components/PushPermissionRequest';

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        {children}
      </main>
      <PushPermissionRequest />
    </div>
  );
}
