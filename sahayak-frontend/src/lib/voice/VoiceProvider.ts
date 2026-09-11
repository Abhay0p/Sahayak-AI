import * as googleTTS from 'google-tts-api';
import { EdgeTTS } from 'node-edge-tts';
import { getVoiceConfig, TTSProvider } from './languageMatrix';
import { LanguageCode } from '../i18n';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function generateTTSAudio(text: string, lang: LanguageCode): Promise<Buffer | null> {
  const config = getVoiceConfig(lang);

  if (!config.isSupported || config.provider === 'text_only') {
    console.log(`[TTS] Language ${lang} is marked as text_only or unsupported.`);
    return null;
  }

  try {
    if (config.provider === 'edge') {
      return await generateEdgeTTS(text, config.ttsVoiceName || 'hi-IN-SwaraNeural');
    } else if (config.provider === 'google') {
      return await generateGoogleTTS(text, config.ttsLocale || 'en');
    }
  } catch (error) {
    console.error(`[TTS] Provider ${config.provider} failed for language ${lang}:`, error);
    return null;
  }
  return null;
}

async function generateEdgeTTS(text: string, voiceName: string): Promise<Buffer> {
  const tts = new EdgeTTS({ voice: voiceName });
  const tempPath = path.join(os.tmpdir(), `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`);
  
  await tts.ttsPromise(text, tempPath);
  const buffer = await fs.readFile(tempPath);
  
  // Clean up
  try {
    await fs.unlink(tempPath);
  } catch (e) {
    console.error('[TTS] Failed to cleanup temp file:', tempPath);
  }
  
  return buffer;
}

async function generateGoogleTTS(text: string, locale: string): Promise<Buffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${locale}&client=tw-ob`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google TTS failed with status: ${res.status}`);
  }
  
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
