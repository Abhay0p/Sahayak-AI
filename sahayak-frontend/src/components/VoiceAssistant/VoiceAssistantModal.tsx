"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider/LanguageProvider';
import { 
  BCP47_LOCALES, 
  LANGUAGE_CONFIG,
  isSTTSupported, 
  speakText, 
  stopSpeech,
  VoiceIntent
} from '@/lib/speech';
import { Mic, MicOff, Volume2, X, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import styles from './VoiceAssistantModal.module.css';
import { apiClient } from '@/lib/apiClient';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  timelineContext?: string; // Real-time summary of patient's day for voice queries
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, timelineContext = '' }) => {
  const { language, t } = useLanguage();
  const router = useRouter();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const config = LANGUAGE_CONFIG[language];
  const isRtl = config?.rtl;

  useEffect(() => {
    if (!isOpen) {
      stopAllListening();
      return;
    }

    // Reset state on open
    setTranscript('');
    setAiResponse(t('voice.assistantGreeting', 'Hello! How can I assist you today?'));
    setErrorMsg(null);
  }, [isOpen, language, t]);

  const stopAllListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const startListening = () => {
    if (!isSTTSupported()) {
      setErrorMsg(t('voice.unavailable', 'Voice input is currently unavailable in this browser. Please type or use buttons.'));
      return;
    }

    stopAllListening();
    setErrorMsg(null);
    setTranscript('');
    setIsListening(true);
    
    // Try to use MediaRecorder -> Backend STT first if full support is expected
    if (config?.sttSupport === 'FULL' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      startMediaRecorder();
    } else {
      // Fallback to browser native
      startBrowserRecognition();
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // split off the data:audio/webm;base64, part
          const b64 = reader.result.split(',')[1];
          resolve(b64);
        } else {
          reject('Failed to convert blob to base64');
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        
        // Stop microphone tracks
        stream.getTracks().forEach(track => track.stop());

        setIsProcessing(true);
        try {
          const b64 = await blobToBase64(audioBlob);
          const res = await apiClient('/api/stt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: b64, lang: BCP47_LOCALES[language] || 'en-IN' })
          });
          
          if (!res.ok) {
            // Backend STT failed/unavailable. Fallback to browser recognition next time
            throw new Error('Backend STT failed');
          }

          const data = await res.json();
          const recognizedText = data.transcript;
          
          if (!recognizedText) {
            setErrorMsg(t('voice.notHeard', "I didn't quite catch that. Please try again."));
            setIsProcessing(false);
            return;
          }

          setTranscript(recognizedText);
          handleUserSpeech(recognizedText);

        } catch (e) {
          console.warn('Backend STT failed, falling back to browser API', e);
          setIsProcessing(false);
          startBrowserRecognition();
        }
      };

      mediaRecorder.start();
    } catch (e) {
      console.warn('MediaRecorder error, falling back to browser API', e);
      startBrowserRecognition();
    }
  };

  const startBrowserRecognition = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('No browser recognition');
      }
      
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      const locale = BCP47_LOCALES[language] || 'en-US';
      recognition.lang = locale;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          handleUserSpeech(currentTranscript);
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access denied. Please grant microphone permission to use voice assistance.');
        } else {
          setErrorMsg(`Voice error: ${event.error}. You can try again or use manual navigation.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setErrorMsg('Could not initialize speech recognition. Please use manual navigation.');
    }
  };

  const stopListening = () => {
    stopAllListening();
  };

  const handleUserSpeech = async (speechText: string) => {
    setIsProcessing(true);
    setAiResponse(t('voice.processing', 'Thinking...'));
    
    try {
      // We pass the transcript to the AI backend to parse intent AND generate the response
      const res = await apiClient('/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: speechText, language: language, timelineContext })
      });
      
      const data = await res.json();
      
      let responseText = '';
      if (data.success) {
        responseText = data.response;
        const intent = data.intent as VoiceIntent;
        
        switch (intent) {
          case 'NAV_HOME': router.push('/'); break;
          case 'NAV_MYDAY': router.push('/my-day'); break;
          case 'NAV_GAMES': router.push('/play'); break;
          case 'NAV_REMINDERS': router.push('/reminders'); break;
          case 'NAV_FAMILY': router.push('/family'); break;
          case 'NAV_MEMORIES': router.push('/memories'); break;
          case 'NAV_HELP': router.push('/help'); break;
          case 'NAV_MESSAGES': router.push('/messages'); break;
          case 'STOP': stopSpeech(); break;
          // Timeline-specific intents — no navigation needed, AI gives spoken response
          case 'TIMELINE_WHATS_NOW':
          case 'TIMELINE_WHATS_NEXT':
          case 'TIMELINE_TODAY_SUMMARY':
          case 'TIMELINE_MISSED':
          case 'TIMELINE_WHEN_ITEM':
            // Response is spoken by speakText below — no nav needed
            break;
          case 'TIMELINE_START_ACTIVITY':
            router.push('/play');
            break;
        }
      } else {
        responseText = t('voice.error', 'Sorry, I encountered an error connecting to the AI.');
      }
      
      setIsProcessing(false);
      setAiResponse(responseText);
      speakText(responseText, language);
      
    } catch (e) {
      setIsProcessing(false);
      const errText = t('voice.error', 'Sorry, I encountered an error connecting to the AI.');
      setAiResponse(errText);
      speakText(errText, language);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={`${styles.modal} ${isRtl ? styles.rtl : ''}`} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <Volume2 className={styles.titleIcon} />
            <h2>{t('voice.assistant', 'Voice Assistant')}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className={styles.body}>
          {errorMsg ? (
            <div className={styles.errorBox}>
              <AlertCircle size={24} color="#f87171" />
              <p>{errorMsg}</p>
              <div className={styles.fallbackActions}>
                <button className={styles.fallbackBtn} onClick={startListening}>
                  <RefreshCw size={16} /> {t('voice.tryAgain', 'Try Again')}
                </button>
                <button className={styles.fallbackBtnSecondary} onClick={onClose}>
                  <MessageSquare size={16} /> {t('voice.useButtons', 'Use Buttons / Touch')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.statusDisplay}>
                <div className={`${styles.micCircle} ${isListening ? styles.listening : ''}`}>
                  {isListening ? <Mic size={36} color="#ffffff" /> : <MicOff size={36} color="#94a3b8" />}
                </div>
                <p className={styles.statusText}>
                  {isListening ? t('voice.listening', 'Listening...') : 
                   isProcessing ? t('voice.processing', 'Thinking...') : 
                   t('voice.clickToSpeak', 'Click mic to speak')}
                </p>
              </div>

              {transcript && (
                <div className={styles.speechBox}>
                  <span className={styles.label}>{t('voice.youSaid', 'You said:')}</span>
                  <p className={styles.userText}>"{transcript}"</p>
                </div>
              )}

              {aiResponse && (
                <div className={styles.responseBox}>
                  <span className={styles.label}>{t('voice.aiSaid', 'Sahayak AI:')}</span>
                  <p className={styles.aiText}>{aiResponse}</p>
                </div>
              )}

              <div className={styles.actionRow}>
                {!isListening ? (
                  <button className={styles.primaryMicBtn} onClick={startListening} disabled={isProcessing}>
                    <Mic size={18} /> {t('voice.startSpeak', 'Start Speaking')}
                  </button>
                ) : (
                  <button className={styles.stopMicBtn} onClick={stopListening}>
                    <MicOff size={18} /> {t('voice.stopSpeak', 'Stop')}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
