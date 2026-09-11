// src/lib/speech.ts
// Multilingual Speech-to-Text (STT) and Text-to-Speech (TTS) Manager

import { LanguageCode, LANGUAGES } from './i18n';

export interface LanguageConfig {
  name: string;
  nativeName: string;
  locale: string;       // BCP-47 locale
  rtl?: boolean;
  sttSupport: 'FULL' | 'BROWSER_ONLY' | 'NONE';
  ttsSupport: 'FULL' | 'BROWSER_ONLY' | 'NONE';
  ttsVoice?: string;    // Edge TTS or Google TTS voice ID
}

export const LANGUAGE_CONFIG: Record<LanguageCode, LanguageConfig> = {
  en: { name: 'English', nativeName: 'English', locale: 'en-IN', sttSupport: 'FULL', ttsSupport: 'FULL', ttsVoice: 'en-IN-NeerjaNeural' },
  hi: { name: 'Hindi', nativeName: 'हिंदी', locale: 'hi-IN', sttSupport: 'FULL', ttsSupport: 'FULL', ttsVoice: 'hi-IN-SwaraNeural' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', locale: 'bn-IN', sttSupport: 'FULL', ttsSupport: 'FULL', ttsVoice: 'bn-IN-TanishaaNeural' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', locale: 'te-IN', sttSupport: 'FULL', ttsSupport: 'FULL', ttsVoice: 'te-IN-ShrutiNeural' },
  mr: { name: 'Marathi', nativeName: 'मराठी', locale: 'mr-IN', sttSupport: 'FULL', ttsSupport: 'FULL', ttsVoice: 'mr-IN-AarohiNeural' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', locale: 'ta-IN', sttSupport: 'FULL', ttsSupport: 'FULL', ttsVoice: 'ta-IN-PallaviNeural' },
  ur: { name: 'Urdu', nativeName: 'اردو', locale: 'ur-PK', rtl: true, sttSupport: 'FULL', ttsSupport: 'FULL', ttsVoice: 'ur-PK-UzmaNeural' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', locale: 'gu-IN', sttSupport: 'FULL', ttsSupport: 'FULL', ttsVoice: 'gu-IN-DhwaniNeural' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', locale: 'kn-IN', sttSupport: 'FULL', ttsSupport: 'FULL', ttsVoice: 'kn-IN-SapnaNeural' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', locale: 'ml-IN', sttSupport: 'FULL', ttsSupport: 'FULL', ttsVoice: 'ml-IN-SobhanaNeural' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', locale: 'pa-IN', sttSupport: 'FULL', ttsSupport: 'FULL', ttsVoice: 'pa-IN-OjasNeural' },
  or: { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', locale: 'or-IN', sttSupport: 'BROWSER_ONLY', ttsSupport: 'NONE' },
  as: { name: 'Assamese', nativeName: 'অসমীয়া', locale: 'as-IN', sttSupport: 'BROWSER_ONLY', ttsSupport: 'NONE' },
  ma: { name: 'Maithili', nativeName: 'मैथिली', locale: 'mai-IN', sttSupport: 'BROWSER_ONLY', ttsSupport: 'NONE' },
  sa: { name: 'Sanskrit', nativeName: 'संस्कृतम्', locale: 'sa-IN', sttSupport: 'BROWSER_ONLY', ttsSupport: 'NONE' },
  ks: { name: 'Kashmiri', nativeName: 'کأشُر', locale: 'ks-IN', rtl: true, sttSupport: 'BROWSER_ONLY', ttsSupport: 'NONE' },
  ne: { name: 'Nepali', nativeName: 'नेपाली', locale: 'ne-NP', sttSupport: 'FULL', ttsSupport: 'FULL', ttsVoice: 'ne-NP-HemkalaNeural' },
  sd: { name: 'Sindhi', nativeName: 'سنڌي', locale: 'sd-PK', rtl: true, sttSupport: 'BROWSER_ONLY', ttsSupport: 'NONE' },
  ko: { name: 'Konkani', nativeName: 'कोंकणी', locale: 'kok-IN', sttSupport: 'BROWSER_ONLY', ttsSupport: 'NONE' },
  do: { name: 'Dogri', nativeName: 'डोगरी', locale: 'doi-IN', sttSupport: 'BROWSER_ONLY', ttsSupport: 'NONE' },
  mn: { name: 'Manipuri', nativeName: 'ꯃꯤꯇꯩꯂꯣꯟ', locale: 'mni-IN', sttSupport: 'BROWSER_ONLY', ttsSupport: 'NONE' },
  si: { name: 'Sinhala', nativeName: 'සිංහල', locale: 'si-LK', sttSupport: 'FULL', ttsSupport: 'FULL', ttsVoice: 'si-LK-ThiliniNeural' },
  br: { name: 'Bodo', nativeName: 'বর', locale: 'brx-IN', sttSupport: 'BROWSER_ONLY', ttsSupport: 'NONE' },
};

export const BCP47_LOCALES = Object.fromEntries(
  Object.entries(LANGUAGE_CONFIG).map(([k, v]) => [k, v.locale])
) as Record<LanguageCode, string>;

// Check if SpeechSynthesis (TTS) is supported for a given language
export function isTTSSupported(lang: LanguageCode): boolean {
  const config = LANGUAGE_CONFIG[lang];
  return config && config.ttsSupport !== 'NONE';
}

// Check if SpeechRecognition (STT) is supported
export function isSTTSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window || !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Active audio element reference to allow cancellation
let activeAudio: HTMLAudioElement | null = null;
let isSpeaking = false;
let cancelSpeechFlag = false;

// Speak text using backend TTS API
export async function speakText(text: string, lang: LanguageCode, onEnd?: () => void) {
  stopSpeech();
  isSpeaking = true;
  cancelSpeechFlag = false;

  const config = LANGUAGE_CONFIG[lang];
  if (!config || config.ttsSupport === 'NONE') {
    console.warn(`[TTS] TTS is completely unsupported for language: ${lang}`);
    if (onEnd) onEnd();
    isSpeaking = false;
    return;
  }

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('sahayak_token') : null;
    
    const res = await fetch(`${API_URL}/api/tts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ text, language: lang })
    });

    if (!res.ok) {
      console.warn(`[TTS] Backend TTS failed for ${lang}. Falling back to client synthesis.`);
      await fallbackSpeak(text, lang);
      if (onEnd && !cancelSpeechFlag) onEnd();
      isSpeaking = false;
      return;
    }

    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    activeAudio = new Audio(audioUrl);

    await new Promise<void>((resolve) => {
      if (!activeAudio) return resolve();
      activeAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      activeAudio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      activeAudio.play().catch((e: Error) => {
        if (e.name !== 'AbortError') {
          console.warn('[TTS] Error playing audio:', e);
        }
        resolve();
      });
    });

    activeAudio = null;
  } catch (error) {
    console.warn('[TTS] Error fetching audio:', error);
    await fallbackSpeak(text, lang);
  }

  isSpeaking = false;
  if (onEnd && !cancelSpeechFlag) {
    onEnd();
  }
}

async function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (voices.length) {
      resolve(voices);
    } else {
      const onVoicesChanged = () => {
        synth.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(synth.getVoices());
      };
      synth.addEventListener('voiceschanged', onVoicesChanged);
    }
  });
}

async function fallbackSpeak(text: string, lang: LanguageCode): Promise<void> {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  const locale = BCP47_LOCALES[lang] || lang;
  const langPrefix = locale.split('-')[0];
  const voices = await getAvailableVoices();
  const matchingVoice = voices.find(v => v.lang.startsWith(langPrefix) || v.lang.includes(langPrefix));
  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }
  utterance.lang = locale;
  return new Promise<void>((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

// Stop current speech
export function stopSpeech() {
  cancelSpeechFlag = true;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
}

// Intent is now parsed on the backend by AI
export type VoiceIntent =
  | 'NAV_HOME'
  | 'NAV_MYDAY'
  | 'NAV_GAMES'
  | 'NAV_REMINDERS'
  | 'NAV_FAMILY'
  | 'NAV_MEMORIES'
  | 'NAV_HELP'
  | 'NAV_MESSAGES'
  | 'STOP'
  | 'REPLAY'
  | 'UNKNOWN'
  | 'CHAT'
  // Timeline-specific intents for care day queries
  | 'TIMELINE_WHATS_NOW'
  | 'TIMELINE_WHATS_NEXT'
  | 'TIMELINE_TODAY_SUMMARY'
  | 'TIMELINE_MISSED'
  | 'TIMELINE_WHEN_ITEM'
  | 'TIMELINE_START_ACTIVITY';


