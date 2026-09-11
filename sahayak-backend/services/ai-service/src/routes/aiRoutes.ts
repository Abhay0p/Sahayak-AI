import { Router } from 'express';
import { handleVoiceChat } from '../controllers/aiController';
import { generateTTS } from '../controllers/ttsController';
import { getMemories } from '../controllers/memoryAssistantController';
import { processSTT } from '../controllers/sttController';

const router = Router();

router.post('/voice-chat', handleVoiceChat);
router.post('/tts', generateTTS);
router.post('/stt', processSTT);
router.get('/memory-assistant', getMemories);

export default router;
