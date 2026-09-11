"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { useCall } from '@/components/CallProvider/CallProvider';
import { useTranslation } from '@/lib/useTranslation';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, AlertCircle } from 'lucide-react';
import styles from './CallModal.module.css';

function formatDuration(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function CallModal() {
  const {
    callState,
    callType,
    callDuration,
    incomingCall,
    callingContactName,
    statusEvent,
    isMuted,
    isCameraOff,
    localVideoRef,
    remoteVideoRef,
    answerCall,
    rejectCall,
    hangUp,
    toggleMute,
    toggleCamera,
    clearStatus,
  } = useCall();

  const { profile } = useUserProfile();
  const { t } = useTranslation(profile?.languagePreference);

  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // ── Ringtone management ────────────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'incoming') {
      const audio = new Audio('/assets/ringtone.mp3');
      audio.loop = true;
      audio.volume = 0.8;
      audio.play().catch(() => {}); // Silently ignore autoplay restriction
      ringtoneRef.current = audio;
    } else {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
        ringtoneRef.current = null;
      }
    }
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    };
  }, [callState]);

  // ── Status event auto-dismiss after 5s ─────────────────────────────────────
  useEffect(() => {
    if (statusEvent && callState === 'idle') {
      const timer = setTimeout(() => clearStatus(), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusEvent, callState, clearStatus]);

  // ── Attach video refs to <video> elements after render ─────────────────────
  const localVideoElementRef  = useCallback((el: HTMLVideoElement | null) => {
    localVideoRef.current = el;
    if (el && localVideoRef.current && (localVideoRef.current as any)._pendingStream) {
      el.srcObject = (localVideoRef.current as any)._pendingStream;
    }
  }, [localVideoRef]);

  const remoteVideoElementRef = useCallback((el: HTMLVideoElement | null) => {
    remoteVideoRef.current = el;
    // If the provider stored a pending stream, attach it now
    if (el && (remoteVideoRef as any).pendingStream) {
      el.srcObject = (remoteVideoRef as any).pendingStream;
    }
  }, [remoteVideoRef]);

  // Determine connection status label
  const connectionLabel = () => {
    switch (callState) {
      case 'calling':    return t('call.calling') || 'Calling...';
      case 'incoming':   return incomingCall?.callType === 'video'
                               ? (t('call.incomingVideo') || 'Incoming Video Call')
                               : (t('call.incomingAudio') || 'Incoming Audio Call');
      case 'connecting': return t('call.connecting') || 'Connecting...';
      case 'in-call':    return formatDuration(callDuration);
      default:           return '';
    }
  };

  // Nothing to show when idle AND no status event
  if (callState === 'idle' && !statusEvent) return null;

  // ── Status notification (declined / missed / error) ────────────────────────
  if (callState === 'idle' && statusEvent) {
    return (
      <div className={styles.statusToast}>
        <AlertCircle size={22} />
        <span>{statusEvent.message}</span>
        <button className={styles.toastClose} onClick={clearStatus}>✕</button>
      </div>
    );
  }

  // ── Compute avatar letter ──────────────────────────────────────────────────
  const contactLetter = (
    incomingCall?.name?.charAt(0)
    || callingContactName?.charAt(0)
    || '?'
  ).toUpperCase();

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Call">
      <div className={styles.modalContent}>

        {/* ── INCOMING CALL ─────────────────────────────────────────────────── */}
        {callState === 'incoming' && incomingCall && (
          <div className={styles.incomingWrapper}>
            <div className={styles.avatarPulse}>
              <div className={styles.avatarPlaceholder}>{contactLetter}</div>
            </div>
            <h2 className={styles.callerName}>{incomingCall.name}</h2>
            <p className={styles.callStatusLabel}>{connectionLabel()}</p>

            <div className={styles.actionButtons}>
              <button
                id="call-decline-btn"
                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                onClick={rejectCall}
                aria-label="Decline call"
              >
                <PhoneOff size={34} />
                <span>{t('call.decline') || 'Decline'}</span>
              </button>
              <button
                id="call-accept-btn"
                className={`${styles.actionBtn} ${styles.acceptBtn}`}
                onClick={answerCall}
                aria-label="Accept call"
              >
                <Phone size={34} />
                <span>{t('call.accept') || 'Accept'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── CALLING / CONNECTING ──────────────────────────────────────────── */}
        {(callState === 'calling' || callState === 'connecting') && (
          <div className={styles.incomingWrapper}>
            <div className={`${styles.avatarPulse} ${styles.outgoing}`}>
              <div className={styles.avatarPlaceholder}>{contactLetter}</div>
            </div>
            <h2 className={styles.callerName}>{callingContactName}</h2>
            <p className={styles.callStatusLabel}>{connectionLabel()}</p>
            <div className={styles.dotsLoader}>
              <span /><span /><span />
            </div>

            <div className={styles.actionButtons}>
              <button
                id="call-cancel-btn"
                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                onClick={hangUp}
                aria-label="Cancel call"
              >
                <PhoneOff size={34} />
                <span>{t('call.cancel') || 'Cancel'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ── IN-CALL ───────────────────────────────────────────────────────── */}
        {callState === 'in-call' && (
          <div className={styles.inCallWrapper}>
            <div className={styles.videoContainer}>
              {/* Remote Video — main view */}
              <video
                ref={remoteVideoElementRef}
                id="remote-video"
                autoPlay
                playsInline
                className={`${styles.remoteVideo} ${callType === 'audio' || isCameraOff ? styles.videoHidden : ''}`}
              />

              {/* Audio-only or camera-off placeholder */}
              {(callType === 'audio') && (
                <div className={styles.audioPlaceholder}>
                  <div className={styles.avatarPlaceholderLarge}>{contactLetter}</div>
                  <p className={styles.audioCallName}>{callingContactName}</p>
                </div>
              )}

              {/* Duration badge */}
              <div className={styles.durationBadge}>
                <span className={styles.durationDot} />
                {connectionLabel()}
              </div>

              {/* Local Video — picture-in-picture */}
              <div className={`${styles.localVideoWrapper} ${callType === 'audio' ? styles.videoHidden : ''}`}>
                <video
                  ref={localVideoElementRef}
                  id="local-video"
                  autoPlay
                  playsInline
                  muted
                  className={`${styles.localVideo} ${isCameraOff ? styles.videoHidden : ''}`}
                />
                {isCameraOff && (
                  <div className={styles.camOffBadge}>
                    <VideoOff size={16} />
                  </div>
                )}
              </div>
            </div>

            {/* Call Controls */}
            <div className={styles.callControls}>
              {/* Mute */}
              <div className={styles.controlGroup}>
                <button
                  id="call-mute-btn"
                  className={`${styles.controlBtn} ${isMuted ? styles.controlBtnActive : ''}`}
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff size={26} /> : <Mic size={26} />}
                </button>
                <span className={styles.controlLabel}>{isMuted ? (t('call.unmute') || 'Unmute') : (t('call.mute') || 'Mute')}</span>
              </div>

              {/* End Call */}
              <div className={styles.controlGroup}>
                <button
                  id="call-end-btn"
                  className={`${styles.controlBtn} ${styles.endCallBtn}`}
                  onClick={hangUp}
                  aria-label="End call"
                >
                  <PhoneOff size={30} />
                </button>
                <span className={styles.controlLabel}>{t('call.end') || 'End'}</span>
              </div>

              {/* Camera toggle */}
              <div className={styles.controlGroup}>
                <button
                  id="call-camera-btn"
                  className={`${styles.controlBtn} ${isCameraOff ? styles.controlBtnActive : ''} ${callType === 'audio' ? styles.controlBtnDisabled : ''}`}
                  onClick={callType === 'video' ? toggleCamera : undefined}
                  disabled={callType === 'audio'}
                  aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                >
                  {isCameraOff ? <VideoOff size={26} /> : <Video size={26} />}
                </button>
                <span className={styles.controlLabel}>{isCameraOff ? (t('call.cameraOn') || 'Cam On') : (t('call.cameraOff') || 'Cam Off')}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
