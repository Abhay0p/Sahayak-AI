import { Request, Response } from 'express';
import textToSpeech from '@google-cloud/text-to-speech';

let client: textToSpeech.TextToSpeechClient | null = null;
try {
  let credentials;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } catch (e) {
      console.warn('Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS_JSON');
    }
  }

  client = new textToSpeech.TextToSpeechClient(credentials ? { credentials } : undefined);
} catch (e) {
  console.warn('Google Cloud TTS client not initialized. Check credentials.');
}

export const generateTTS = async (req: Request, res: Response) => {
  try {
    const { text, language } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!client) {
      return res.status(501).json({ error: 'TTS Provider not configured. Fallback to client synthesis.' });
    }

    const request = {
      input: { text: text },
      voice: { languageCode: language || 'en-IN' },
      audioConfig: { audioEncoding: 'MP3' as const },
    };

    const [response] = await client.synthesizeSpeech(request);
    
    if (response.audioContent) {
      // Return as raw buffer to be played by client as a blob
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.send(response.audioContent);
    } else {
      return res.status(500).json({ error: 'Failed to generate audio' });
    }
  } catch (error: any) {
    console.error('TTS Error:', error.message);
    return res.status(501).json({ error: error.message });
  }
};
