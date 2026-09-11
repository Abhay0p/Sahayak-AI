import { Request, Response } from 'express';
import speech from '@google-cloud/speech';

let client: speech.SpeechClient | null = null;
try {
  let credentials;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } catch (e) {
      console.warn('Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS_JSON');
    }
  }

  client = new speech.SpeechClient(credentials ? { credentials } : undefined);
} catch (e) {
  console.warn('Google Cloud Speech client not initialized. Check credentials.');
}

export const processSTT = async (req: Request, res: Response) => {
  try {
    const lang = req.body.lang || 'en-IN';
    const audioBase64 = req.body.audioBase64; // Expecting WebM or basic base64 audio

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data missing' });
    }

    if (!client) {
      return res.status(501).json({ error: 'STT Provider not configured. Fallback to browser STT.' });
    }

    const audio = {
      content: audioBase64,
    };
    const config = {
      languageCode: lang,
    };

    const request = {
      audio: audio,
      config: config,
    };

    // Detects speech in the audio file
    const [response] = await client.recognize(request as any);
    const transcription = response.results
      ?.map(result => result.alternatives?.[0].transcript)
      .join('\n');

    if (!transcription) {
      return res.status(200).json({ transcript: '' });
    }

    return res.status(200).json({ transcript: transcription });
  } catch (error: any) {
    console.error('STT Error:', error.message);
    // Return 501 so frontend knows to fallback
    return res.status(501).json({ error: error.message });
  }
};
