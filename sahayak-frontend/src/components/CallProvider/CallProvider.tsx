"use client";

import React, {
  createContext, useContext, useEffect, useRef, useState,
  useCallback, ReactNode
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserProfile } from '@/components/UserProfileProvider/UserProfileProvider';
import { apiClient } from '@/lib/apiClient';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8005';
const API_BASE   = process.env.NEXT_PUBLIC_API_URL    || 'http://localhost:8000';

// ─── ICE / STUN Configuration ────────────────────────────────────────────────
// For localhost: Google public STUN is sufficient.
// For production across networks: add a TURN server via env vars.
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // TURN server – set env vars to enable (see .env.local.example)
  ...(process.env.NEXT_PUBLIC_TURN_URL ? [{
    urls:       process.env.NEXT_PUBLIC_TURN_URL,
    username:   process.env.NEXT_PUBLIC_TURN_USERNAME || '',
    credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '',
  } as RTCIceServer] : []),
];

// ─── Call timeout (ms) before marking MISSED ─────────────────────────────────
const CALL_TIMEOUT_MS = 45_000;

// ─── Types ────────────────────────────────────────────────────────────────────
export type CallState = 'idle' | 'calling' | 'incoming' | 'connecting' | 'in-call';
export type CallType  = 'audio' | 'video';

export interface IncomingCallData {
  from:     string;
  name:     string;
  offer:    RTCSessionDescriptionInit;
  callType: CallType;
  callId?:  string;
}

export interface CallStatusEvent {
  type: 'declined' | 'missed' | 'cancelled' | 'busy' | 'error';
  message: string;
}

interface CallContextProps {
  callState:          CallState;
  callType:           CallType;
  callDuration:       number;
  incomingCall:       IncomingCallData | null;
  callingContactId:   string | null;
  callingContactName: string | null;
  statusEvent:        CallStatusEvent | null;
  isMuted:            boolean;
  isCameraOff:        boolean;
  localVideoRef:      React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef:     React.RefObject<HTMLVideoElement | null>;
  startCall:   (contactId: string, contactName: string, type: CallType) => Promise<void>;
  answerCall:  () => Promise<void>;
  rejectCall:  () => void;
  hangUp:      () => void;
  toggleMute:  () => void;
  toggleCamera:() => void;
  clearStatus: () => void;
}

const CallContext = createContext<CallContextProps | undefined>(undefined);

// ─── Auth helper ──────────────────────────────────────────────────────────────
function getToken(): string {
  return (typeof window !== 'undefined' ? localStorage.getItem('sahayak_token') : null) || '';
}
async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useUserProfile();
  const myProfileId = profile?.id || '';
  const myName      = profile?.preferredName || profile?.firstName || 'User';

  // ── state ───────────────────────────────────────────────────────────────────
  const [callState,          setCallState]          = useState<CallState>('idle');
  const [callType,           setCallType]           = useState<CallType>('video');
  const [incomingCall,       setIncomingCall]       = useState<IncomingCallData | null>(null);
  const [callingContactId,   setCallingContactId]   = useState<string | null>(null);
  const [callingContactName, setCallingContactName] = useState<string | null>(null);
  const [statusEvent,        setStatusEvent]        = useState<CallStatusEvent | null>(null);
  const [isMuted,            setIsMuted]            = useState(false);
  const [isCameraOff,        setIsCameraOff]        = useState(false);
  const [callDuration,       setCallDuration]       = useState(0);

  // ── refs ────────────────────────────────────────────────────────────────────
  const socketRef          = useRef<Socket | null>(null);
  const pcRef              = useRef<RTCPeerConnection | null>(null);
  const localStreamRef     = useRef<MediaStream | null>(null);
  const currentCallIdRef   = useRef<string | null>(null);
  const callTimerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const callTimeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRemoteStream = useRef<MediaStream | null>(null);

  // These refs hold the actual <video> DOM elements rendered inside CallModal
  const localVideoRef  = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // ── Duration timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'in-call') {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => { if (callTimerRef.current) clearInterval(callTimerRef.current); };
  }, [callState]);

  // ── Attach pending remote stream when video element mounts ──────────────────
  // CallModal renders the <video ref={remoteVideoRef} /> only when in-call.
  // The 'track' event may fire before the element mounts, so we store the stream
  // and attach it once the element is available.
  useEffect(() => {
    if (callState === 'in-call' && pendingRemoteStream.current && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = pendingRemoteStream.current;
      pendingRemoteStream.current = null;
    }
  }, [callState]);

  // ── Socket init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!myProfileId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'], reconnectionAttempts: 5 });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('register', myProfileId));

    // ── Incoming call (offer arrives) ────────────────────────────────────────
    socket.on('incoming-call', (data: IncomingCallData) => {
      if (callState !== 'idle') {
        // We're busy — send busy signal back
        socket.emit('call-busy', { to: data.from });
        return;
      }
      setIncomingCall(data);
      setCallState('incoming');
      setCallType(data.callType);
    });

    // ── Answer arrived (callee sent answer) ──────────────────────────────────
    socket.on('call-answered', async (answer: RTCSessionDescriptionInit) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.error('Error setting remote description:', e);
        }
      }
    });

    // ── ICE candidate from remote ────────────────────────────────────────────
    socket.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
      if (pcRef.current && pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
    });

    // ── Remote rejected ──────────────────────────────────────────────────────
    socket.on('call-rejected', () => {
      clearCallTimeout();
      setStatusEvent({ type: 'declined', message: 'Call was declined.' });
      hangUpLocalOnly();
    });

    // ── Remote is busy ───────────────────────────────────────────────────────
    socket.on('call-busy', () => {
      clearCallTimeout();
      setStatusEvent({ type: 'busy', message: 'User is currently on another call.' });
      hangUpLocalOnly();
    });

    // ── Remote ended ─────────────────────────────────────────────────────────
    socket.on('call-ended', () => {
      hangUpLocalOnly();
    });

    // ── Caller cancelled ─────────────────────────────────────────────────────
    socket.on('call-cancelled', () => {
      hangUpLocalOnly();
    });

    return () => { socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfileId]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const clearCallTimeout = () => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  };

  const createPeerConnection = (onTrack: (stream: MediaStream) => void): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const target = callingContactIdRef.current || incomingCallRef.current?.from;
        if (target) {
          socketRef.current?.emit('ice-candidate', {
            to:        target,
            candidate: event.candidate.toJSON(),
          });
        }
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      onTrack(stream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('in-call');
        clearCallTimeout();
        if (currentCallIdRef.current) {
          authFetch(`${API_BASE}/api/calls/${currentCallIdRef.current}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'CONNECTED' }),
          }).catch(() => {});
        }
      }
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setStatusEvent({ type: 'error', message: 'Connection lost.' });
        hangUpLocalOnly();
      }
    };

    return pc;
  };

  // We need stable refs to callingContactId and incomingCall inside callbacks
  const callingContactIdRef = useRef<string | null>(null);
  const incomingCallRef     = useRef<IncomingCallData | null>(null);

  useEffect(() => { callingContactIdRef.current = callingContactId; }, [callingContactId]);
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);

  const getLocalStream = async (video: boolean): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  };

  const attachRemoteStream = (stream: MediaStream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      pendingRemoteStream.current = null;
    } else {
      // Video element not yet mounted — store for attachment after callState update
      pendingRemoteStream.current = stream;
    }
  };

  const hangUpLocalOnly = useCallback(() => {
    clearCallTimeout();

    // Close PeerConnection
    if (pcRef.current) {
      pcRef.current.ontrack       = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    // Stop all media tracks
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;

    // Clear video elements
    if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    pendingRemoteStream.current = null;

    setCallState('idle');
    setCallingContactId(null);
    setCallingContactName(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
    currentCallIdRef.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────────

  const hangUp = useCallback(() => {
    const targetId = callingContactId || incomingCall?.from;
    if (targetId) socketRef.current?.emit('end-call', { to: targetId });

    if (currentCallIdRef.current) {
      authFetch(`${API_BASE}/api/calls/${currentCallIdRef.current}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ENDED' }),
      }).catch(() => {});
    }

    hangUpLocalOnly();
  }, [callingContactId, incomingCall, hangUpLocalOnly]);

  const startCall = useCallback(async (contactId: string, contactName: string, type: CallType) => {
    if (callState !== 'idle') {
      setStatusEvent({ type: 'busy', message: 'You are already in a call.' });
      return;
    }

    setCallingContactId(contactId);
    setCallingContactName(contactName);
    setCallType(type);
    setCallState('calling');
    setStatusEvent(null);

    // Timeout → MISSED after 45s
    callTimeoutRef.current = setTimeout(() => {
      setStatusEvent({ type: 'missed', message: `${contactName} didn't answer.` });
      if (currentCallIdRef.current) {
        authFetch(`${API_BASE}/api/calls/${currentCallIdRef.current}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'MISSED' }),
        }).catch(() => {});
      }
      socketRef.current?.emit('cancel-call', { to: contactId });
      hangUpLocalOnly();
    }, CALL_TIMEOUT_MS);

    try {
      // 1. Create DB Record (best-effort)
      let callId: string | undefined;
      try {
        const callData = await apiClient('/api/calls/initiate', {
          method: 'POST',
          body: JSON.stringify({ calleeId: contactId }),
        });
        callId = callData.id;
        currentCallIdRef.current = callId || null;
      } catch (err) {
        console.warn('Call DB logging failed (non-fatal):', err);
      }

      // 2. Get local media
      const stream = await getLocalStream(type === 'video');

      // 3. Build RTCPeerConnection
      const pc = createPeerConnection(attachRemoteStream);
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // 4. Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 5. Send offer via signaling
      socketRef.current?.emit('call-user', {
        to:       contactId,
        from:     myProfileId,
        name:     myName,
        offer:    pc.localDescription,
        callType: type,
        callId,
      });

    } catch (err: any) {
      clearCallTimeout();
      console.error('Call init error:', err);
      const msg = err?.name === 'NotAllowedError'
        ? 'Camera/microphone permission was denied. Please allow access and try again.'
        : 'Could not start the call. Please check your camera and microphone.';
      setStatusEvent({ type: 'error', message: msg });
      hangUpLocalOnly();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState, myProfileId, myName, hangUpLocalOnly]);

  const answerCall = useCallback(async () => {
    if (!incomingCall) return;

    setCallState('connecting');
    setStatusEvent(null);

    try {
      const stream = await getLocalStream(incomingCall.callType === 'video');

      const pc = createPeerConnection(attachRemoteStream);
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Set remote offer
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer
      socketRef.current?.emit('answer-call', {
        to:     incomingCall.from,
        answer: pc.localDescription,
      });

      currentCallIdRef.current = incomingCall.callId || null;
      setCallingContactId(incomingCall.from);
      setCallingContactName(incomingCall.name);
      setCallType(incomingCall.callType);
      setIncomingCall(null);

    } catch (err: any) {
      console.error('Answer error:', err);
      const msg = err?.name === 'NotAllowedError'
        ? 'Camera/microphone permission denied. Cannot connect call.'
        : 'Could not connect the call. Please check camera/microphone access.';
      setStatusEvent({ type: 'error', message: msg });
      rejectCall();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCall, hangUpLocalOnly]);

  const rejectCall = useCallback(() => {
    if (incomingCall) {
      socketRef.current?.emit('reject-call', { to: incomingCall.from });
      if (incomingCall.callId) {
        authFetch(`${API_BASE}/api/calls/${incomingCall.callId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'DECLINED' }),
        }).catch(() => {});
      }
    }
    hangUpLocalOnly();
  }, [incomingCall, hangUpLocalOnly]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const newState = !isMuted;
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !newState; });
      setIsMuted(newState);
    }
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const newState = !isCameraOff;
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !newState; });
      setIsCameraOff(newState);
    }
  }, [isCameraOff]);

  const clearStatus = useCallback(() => setStatusEvent(null), []);

  return (
    <CallContext.Provider
      value={{
        callState, callType, callDuration,
        incomingCall, callingContactId, callingContactName,
        statusEvent,
        isMuted, isCameraOff,
        localVideoRef, remoteVideoRef,
        startCall, answerCall, rejectCall, hangUp,
        toggleMute, toggleCamera, clearStatus,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};
