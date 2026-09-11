import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

interface Call {
  id: string;
  callerId: string;
  calleeId: string;
  status: 'INITIATED' | 'RINGING' | 'CONNECTED' | 'ENDED' | 'FAILED';
  startedAt: Date;
  endedAt?: Date;
}

interface CallContextValue {
  activeCall?: Call;
  startCall: (calleeId: string) => Promise<void>;
  endCall: () => Promise<void>;
}

const CallContext = createContext<CallContextValue | undefined>(undefined);

export const useCall = (): CallContextValue => {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error('useCall must be used within CallProvider');
  }
  return ctx;
};

interface CallProviderProps {
  children: ReactNode;
}

export const CallProvider: React.FC<CallProviderProps> = ({ children }) => {
  const [activeCall, setActiveCall] = useState<Call | undefined>(undefined);

  const startCall = async (calleeId: string) => {
    try {
      const response = await apiClient('/api/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calleeId }),
      });
      if (!response.ok) throw new Error('Failed to initiate call');
      const data: Call = await response.json();
      setActiveCall(data);
    } catch (e) {
      console.error(e);
    }
  };

  const endCall = async () => {
    if (!activeCall) return;
    try {
      await apiClient(`/api/calls/${activeCall.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setActiveCall(undefined);
    }
  };

  // Listen for incoming call events via SSE
  useEffect(() => {
    const eventSource = new EventSource('/api/calls/signal');
    eventSource.onmessage = (e) => {
      const incoming: Call = JSON.parse(e.data);
      // Simple handling: auto-accept for demo
      setActiveCall(incoming);
    };
    eventSource.onerror = (e) => {
      console.error('SSE error', e);
      eventSource.close();
    };
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <CallContext.Provider value={{ activeCall, startCall, endCall }}>
      {children}
    </CallContext.Provider>
  );
};
