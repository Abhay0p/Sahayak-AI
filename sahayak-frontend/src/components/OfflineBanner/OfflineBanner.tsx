"use client";
import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { processOfflineQueue, getOfflineQueue } from '@/lib/offlineSync';

export const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingItems, setPendingItems] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = async () => {
      setIsOnline(true);
      const queue = getOfflineQueue();
      if (queue.length > 0) {
        setIsSyncing(true);
        setPendingItems(queue.length);
        await processOfflineQueue();
        setIsSyncing(false);
        setPendingItems(0);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    setIsOnline(navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for pending items if online
    if (navigator.onLine) {
      handleOnline();
    } else {
      setPendingItems(getOfflineQueue().length);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !isSyncing) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: isOnline ? 'var(--success-color)' : 'var(--warning-color)',
      color: isOnline ? 'white' : '#333',
      padding: '0.75rem 1.5rem',
      borderRadius: '999px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      zIndex: 9999,
      fontWeight: 600,
      transition: 'all 0.3s ease'
    }}>
      {!isOnline ? (
        <>
          <WifiOff size={20} />
          You are offline. {pendingItems > 0 ? `${pendingItems} items pending sync.` : 'Changes will be saved locally.'}
        </>
      ) : (
        <>
          <RefreshCw size={20} style={{ animation: 'spin 2s linear infinite' }} />
          Syncing {pendingItems} item(s)...
        </>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
};
