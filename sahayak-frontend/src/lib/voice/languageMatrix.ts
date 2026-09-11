import { LanguageCode } from '../i18n';

export type TTSProvider = 'edge' | 'google' | 'text_only';

export interface LanguageVoiceConfig {
  language: LanguageCode;
  provider: TTSProvider;
  ttsLocale?: string;
  ttsVoiceName?: string; // e.g. hi-IN-SwaraNeural
  isSupported: boolean;
  notes?: string;
}

export const VOICE_LANGUAGE_MATRIX: Record<LanguageCode, LanguageVoiceConfig> = {
  en: { language: 'en', provider: 'edge', ttsLocale: 'en-IN', ttsVoiceName: 'en-IN-NeerjaNeural', isSupported: true },
  hi: { language: 'hi', provider: 'edge', ttsLocale: 'hi-IN', ttsVoiceName: 'hi-IN-SwaraNeural', isSupported: true },
  bn: { language: 'bn', provider: 'edge', ttsLocale: 'bn-IN', ttsVoiceName: 'bn-IN-TanishaaNeural', isSupported: true },
  te: { language: 'te', provider: 'edge', ttsLocale: 'te-IN', ttsVoiceName: 'te-IN-ShrutiNeural', isSupported: true },
  mr: { language: 'mr', provider: 'edge', ttsLocale: 'mr-IN', ttsVoiceName: 'mr-IN-AarohiNeural', isSupported: true },
  ta: { language: 'ta', provider: 'edge', ttsLocale: 'ta-IN', ttsVoiceName: 'ta-IN-PallaviNeural', isSupported: true },
  ur: { language: 'ur', provider: 'edge', ttsLocale: 'ur-IN', ttsVoiceName: 'ur-IN-GulNeural', isSupported: true },
  gu: { language: 'gu', provider: 'edge', ttsLocale: 'gu-IN', ttsVoiceName: 'gu-IN-DhwaniNeural', isSupported: true },
  kn: { language: 'kn', provider: 'edge', ttsLocale: 'kn-IN', ttsVoiceName: 'kn-IN-SapnaNeural', isSupported: true },
  ml: { language: 'ml', provider: 'edge', ttsLocale: 'ml-IN', ttsVoiceName: 'ml-IN-SobhanaNeural', isSupported: true },
  ne: { language: 'ne', provider: 'edge', ttsLocale: 'ne-NP', ttsVoiceName: 'ne-NP-HemkalaNeural', isSupported: true },
  
  // Languages falling back to Direct Google Translate TTS (bypassing wrapper strictness)
  pa: { language: 'pa', provider: 'google', ttsLocale: 'pa', isSupported: true, notes: 'Punjabi via Direct Google' },
  ko: { language: 'ko', provider: 'google', ttsLocale: 'ko', isSupported: true, notes: 'Konkani via Direct Google' },
  si: { language: 'si', provider: 'google', ttsLocale: 'si', isSupported: true },

  // Cross-lingual Script Fallbacks (Using Hindi/Bengali Neural voices to read identical scripts)
  as: { language: 'as', provider: 'edge', ttsLocale: 'bn-IN', ttsVoiceName: 'bn-IN-TanishaaNeural', isSupported: true, notes: 'Assamese uses Bengali Script fallback' },
  mn: { language: 'mn', provider: 'edge', ttsLocale: 'bn-IN', ttsVoiceName: 'bn-IN-TanishaaNeural', isSupported: true, notes: 'Manipuri uses Bengali Script fallback' },
  sa: { language: 'sa', provider: 'edge', ttsLocale: 'hi-IN', ttsVoiceName: 'hi-IN-SwaraNeural', isSupported: true, notes: 'Sanskrit uses Devanagari Script fallback' },
  ma: { language: 'ma', provider: 'edge', ttsLocale: 'hi-IN', ttsVoiceName: 'hi-IN-SwaraNeural', isSupported: true, notes: 'Maithili uses Devanagari Script fallback' },
  do: { language: 'do', provider: 'edge', ttsLocale: 'hi-IN', ttsVoiceName: 'hi-IN-SwaraNeural', isSupported: true, notes: 'Dogri uses Devanagari Script fallback' },
  br: { language: 'br', provider: 'edge', ttsLocale: 'hi-IN', ttsVoiceName: 'hi-IN-SwaraNeural', isSupported: true, notes: 'Bodo uses Devanagari Script fallback' },
  ks: { language: 'ks', provider: 'edge', ttsLocale: 'hi-IN', ttsVoiceName: 'hi-IN-SwaraNeural', isSupported: true, notes: 'Kashmiri uses Devanagari Script fallback' },
  sd: { language: 'sd', provider: 'edge', ttsLocale: 'hi-IN', ttsVoiceName: 'hi-IN-SwaraNeural', isSupported: true, notes: 'Sindhi uses Devanagari Script fallback' },

  // Languages strictly unsupported without premium APIs (No script overlap)
  or: { language: 'or', provider: 'text_only', isSupported: false, notes: 'Odia requires Odia script' },
  // Note: Santali is not heavily digitized. Text only.
};

export function getVoiceConfig(lang: LanguageCode): LanguageVoiceConfig {
  return VOICE_LANGUAGE_MATRIX[lang] || { language: lang, provider: 'text_only', isSupported: false };
}
