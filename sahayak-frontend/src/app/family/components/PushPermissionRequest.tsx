"use client";
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export default function PushPermissionRequest() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if notifications are supported and not already granted/denied
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      if (Notification.permission === 'default') {
        // Delay showing it so it's not jarring immediately on load
        const timer = setTimeout(() => setShow(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });

        // Save subscription to backend
        await apiClient('/api/notifications/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
      }
    } catch (err) {
      console.error('Failed to subscribe to push notifications', err);
    } finally {
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-lg shadow-2xl z-50 text-white animate-in slide-in-from-bottom-5">
      <div className="flex gap-4">
        <div className="bg-accent-color/20 p-2 rounded-full h-fit">
          <Bell className="text-accent-color" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1">Enable Device Alerts?</h3>
          <p className="text-sm opacity-80 mb-4">
            Allow Sahayak AI to send updates about your loved one's activity and important reminders directly to your device?
          </p>
          <div className="flex gap-3">
            <button onClick={requestPermission} className="bg-accent-color hover:bg-accent-color/80 px-4 py-2 rounded-md font-medium text-sm transition">
              Allow
            </button>
            <button onClick={() => setShow(false)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-md font-medium text-sm transition">
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
