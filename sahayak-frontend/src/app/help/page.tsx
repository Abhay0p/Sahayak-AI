"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { ArrowLeft, Phone, Heart, Users, Info, Mic, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider/LanguageProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './help.module.css';
import { apiClient } from '@/lib/apiClient';

export default function HelpPage() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // UI state
  const [isOffline, setIsOffline] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [helpReason, setHelpReason] = useState('I need assistance');

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await apiClient('/api/contacts');
      const data = await res.json();
      return data.success ? data : { trustedContacts: [], primaryCaregiver: null };
    }
  });

  const { data: activeRequests = [] } = useQuery({
    queryKey: ['helpRequests'],
    queryFn: async () => {
      const res = await apiClient('/api/help/request');
      const data = await res.json();
      if (!data.success) return [];
      return data.helpRequests.filter((r: any) => r.status !== 'RESOLVED' && r.status !== 'CANCELLED');
    },
    refetchInterval: 15_000,
  });

  const caregiver = contactsData?.primaryCaregiver;

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncOfflineRequests();
    };
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (!navigator.onLine) setIsOffline(true);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineRequests = async () => {
    const queued = localStorage.getItem('offlineHelpRequests');
    if (queued) {
      const requests = JSON.parse(queued);
      for (const req of requests) {
        await submitMutation.mutateAsync({ type: req.requestType, message: req.message, isSync: true });
      }
      localStorage.removeItem('offlineHelpRequests');
    }
  };

  const submitMutation = useMutation({
    mutationFn: async ({ type, message, isSync }: { type: string, message: string, isSync?: boolean }) => {
      if (isOffline && !isSync) {
        const queued = JSON.parse(localStorage.getItem('offlineHelpRequests') || '[]');
        queued.push({ requestType: type, message, timestamp: Date.now() });
        localStorage.setItem('offlineHelpRequests', JSON.stringify(queued));
        throw new Error('OFFLINE');
      }

      const res = await apiClient('/api/help/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: type, message })
      });
      const data = await res.json();
      if (!data.success) throw new Error('Failed to send request');
      return data;
    },
    onSuccess: (data, variables) => {
      if (variables.isSync) return;
      setStatusMessage('Your caregiver has received your request.');
      queryClient.invalidateQueries({ queryKey: ['helpRequests'] });
      setShowHelpModal(false);
    },
    onError: (err: any) => {
      if (err.message === 'OFFLINE') {
        setStatusMessage('You are offline. Your request will be sent when the internet returns.');
        setShowHelpModal(false);
      } else {
        setStatusMessage('Failed to send request. Please call directly.');
      }
    }
  });

  const submitHelpRequest = async (type: string, message: string = '', isSync = false) => {
    submitMutation.mutate({ type, message, isSync });
  };

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient(`/api/help/request/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      if (!res.ok) throw new Error('Failed to cancel');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpRequests'] });
    }
  });

  const cancelRequest = async (id: string) => {
    cancelMutation.mutate(id);
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.header}>
          <Link href="/" className={styles.backButton}>
            <ArrowLeft size={32} />
          </Link>
          <h1 className={styles.title}>{t('help.title') || 'Help & SOS'}</h1>
        </div>

        {statusMessage && (
          <div className={styles.statusBanner}>
            <Info size={24} />
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage('')}><X size={20} /></button>
          </div>
        )}
        
        {isOffline && (
          <div className={styles.offlineBanner}>
            <AlertCircle size={24} />
            <span>You are currently offline. Some features may be limited.</span>
          </div>
        )}

        {activeRequests.length > 0 && (
          <div className={styles.activeRequestsCard}>
            <h2>Active Help Requests</h2>
            {activeRequests.map((req: any) => (
              <div key={req.id} className={styles.requestItem}>
                <div>
                  <strong>{req.requestType}</strong>
                  <p>Status: {req.status === 'ACKNOWLEDGED' ? 'Caregiver has seen this and is responding.' : 'Waiting for acknowledgment...'}</p>
                </div>
                <button className={styles.cancelBtn} onClick={() => cancelRequest(req.id)}>Cancel Request</button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.questionBanner}>
          <h2>{t('help.subtitle') || 'How can we help you?'}</h2>
        </div>

        <div className={styles.grid}>
          {/* I NEED HELP */}
          <button className={`${styles.actionCard} ${styles.primaryCard}`} onClick={() => setShowHelpModal(true)}>
            <Heart size={48} />
            <span>{t('help.iNeedHelp') || 'I NEED HELP'}</span>
          </button>

          {/* CONTACT CAREGIVER */}
          <button className={styles.actionCard} onClick={() => {
            if (caregiver) {
              window.location.href = `tel:${caregiver.phoneNumber || ''}`;
            } else {
              setStatusMessage('No primary caregiver assigned.');
            }
          }}>
            <Users size={48} />
            <span>{t('help.contactCaregiver') || 'CONTACT CAREGIVER'}</span>
          </button>

          {/* TALK FOR HELP */}
          <button className={`${styles.actionCard} ${styles.voiceCard}`}>
            <Mic size={48} />
            <span>{t('help.talkForHelp') || 'TALK FOR HELP'}</span>
          </button>

          {/* EMERGENCY */}
          <button className={`${styles.actionCard} ${styles.emergencyCard}`} onClick={() => setShowEmergencyModal(true)}>
            <AlertCircle size={48} />
            <span>{t('help.emergency') || 'EMERGENCY 🆘'}</span>
          </button>
        </div>

        {/* HELP MODAL */}
        {showHelpModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2>Do you need help?</h2>
              <div className={styles.reasonsList}>
                <label><input type="radio" name="reason" value="I am feeling unwell" onChange={(e) => setHelpReason(e.target.value)} /> I am feeling unwell</label>
                <label><input type="radio" name="reason" value="I need assistance" onChange={(e) => setHelpReason(e.target.value)} defaultChecked /> I need assistance</label>
                <label><input type="radio" name="reason" value="I am confused" onChange={(e) => setHelpReason(e.target.value)} /> I am confused</label>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.confirmBtn} onClick={() => submitHelpRequest(helpReason)}>YES, SEND HELP REQUEST</button>
                <button className={styles.cancelModalBtn} onClick={() => setShowHelpModal(false)}>NO, GO BACK</button>
              </div>
            </div>
          </div>
        )}

        {/* EMERGENCY MODAL */}
        {showEmergencyModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2 style={{color: '#dc2626'}}>Are you sure you need emergency help?</h2>
              <p>This will call your configured emergency contact immediately.</p>
              <div className={styles.modalActions}>
                <button className={`${styles.confirmBtn} ${styles.emergencyConfirm}`} onClick={() => {
                  setShowEmergencyModal(false);
                  window.location.href = 'tel:112'; // Fallback generic device emergency
                }}>YES — CONTINUE</button>
                <button className={styles.cancelModalBtn} onClick={() => setShowEmergencyModal(false)}>CANCEL</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
