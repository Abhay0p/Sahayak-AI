"use client";
import React from 'react';
import { useNotifications } from '@/components/NotificationProvider/NotificationProvider';
import { useRouter } from 'next/navigation';
import { Bell, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationToaster() {
  const { activeToasts, dismissToast, markDbRead } = useNotifications();
  const router = useRouter();

  const handleAction = (notif: any) => {
    markDbRead(notif.id);
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    } else {
      router.push('/');
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dismissToast(id);
  };

  if (activeToasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxWidth: '400px',
      width: '90%'
    }}>
      <AnimatePresence>
        {activeToasts.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            style={{
              background: notif.type === 'HELP_REQUEST' ? 'var(--danger-color)' : 'var(--bg-card)',
              border: `1px solid ${notif.type === 'HELP_REQUEST' ? '#ef4444' : 'var(--primary-color)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              color: 'white',
              boxShadow: 'var(--shadow-md)',
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => handleAction(notif)}
          >
            <button 
              onClick={(e) => handleDismiss(e, notif.id)}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              {notif.type === 'HELP_REQUEST' ? <AlertTriangle size={24} /> : <Bell size={24} color="var(--primary-color)" />}
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{notif.title}</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
              {notif.body}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
