"use client";

import React, { useState } from 'react';
import { Phone, Video, X, ChevronRight } from 'lucide-react';
import { useCall, CallType } from '@/components/CallProvider/CallProvider';
import styles from './CallTypeSelector.module.css';

interface Contact {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface CallTypeSelectorProps {
  contacts: Contact[];
  onClose: () => void;
}

export default function CallTypeSelector({ contacts, onClose }: CallTypeSelectorProps) {
  const { startCall, callState } = useCall();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(
    contacts.length === 1 ? contacts[0] : null
  );

  const handleCall = async (type: CallType) => {
    if (!selectedContact) return;
    onClose();
    await startCall(selectedContact.id, selectedContact.name, type);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Start a Call</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        {/* Contact picker (only shown if multiple contacts) */}
        {!selectedContact && contacts.length > 1 && (
          <div className={styles.contactList}>
            <p className={styles.hint}>Who would you like to call?</p>
            {contacts.map(c => (
              <button
                key={c.id}
                className={styles.contactItem}
                onClick={() => setSelectedContact(c)}
              >
                <div className={styles.contactAvatar}>
                  {c.avatarUrl
                    ? <img src={c.avatarUrl} alt={c.name} />
                    : <span>{c.name.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <span className={styles.contactName}>{c.name}</span>
                <ChevronRight size={18} className={styles.chevron} />
              </button>
            ))}
          </div>
        )}

        {/* No contacts */}
        {contacts.length === 0 && (
          <div className={styles.empty}>
            <p>No authorized contacts found.</p>
            <p className={styles.emptySub}>Add family members to make calls.</p>
          </div>
        )}

        {/* Call type buttons */}
        {selectedContact && (
          <div className={styles.callOptions}>
            <div className={styles.selectedContact}>
              <div className={styles.contactAvatar}>
                {selectedContact.avatarUrl
                  ? <img src={selectedContact.avatarUrl} alt={selectedContact.name} />
                  : <span>{selectedContact.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              <span className={styles.contactName}>{selectedContact.name}</span>
              {contacts.length > 1 && (
                <button
                  className={styles.changeBtn}
                  onClick={() => setSelectedContact(null)}
                >
                  Change
                </button>
              )}
            </div>

            <div className={styles.callButtons}>
              <button
                id="start-voice-call-btn"
                className={`${styles.callBtn} ${styles.voiceBtn}`}
                onClick={() => handleCall('audio')}
                disabled={callState !== 'idle'}
              >
                <Phone size={28} />
                <span>Voice Call</span>
              </button>
              <button
                id="start-video-call-btn"
                className={`${styles.callBtn} ${styles.videoBtn}`}
                onClick={() => handleCall('video')}
                disabled={callState !== 'idle'}
              >
                <Video size={28} />
                <span>Video Call</span>
              </button>
            </div>

            <p className={styles.secureNote}>🔒 End-to-end encrypted · Authorized family only</p>
          </div>
        )}
      </div>
    </div>
  );
}
