import { Request, Response } from 'express';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export const handleVoiceChat = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const { transcript, language, timelineContext } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript is required' });

    // Build context section for the AI if timeline data is available
    const timelineSection = timelineContext
      ? `\n\nCURRENT PATIENT DAY CONTEXT (real, live data):\n${timelineContext}\n\nUse this context to answer timeline-specific questions accurately.`
      : '';

    const systemInstruction = `You are Sahayak, a highly empathetic, warm, and patient elderly companion AI.
The user's locale is ${language || 'English'}. Respond strictly in that language.
You are the voice assistant for Sahayak AI, an application for elderly users.
You must parse the user's spoken intent and decide if it is a navigation command, a timeline query, or conversational chat.
${timelineSection}

INTENT OPTIONS:
- NAV_HOME: User wants to go to home or dashboard.
- NAV_MYDAY: User wants to check their routine, schedule, or day (full page).
- NAV_GAMES: User wants to play games or brain exercises.
- NAV_REMINDERS: User wants to check reminders.
- NAV_FAMILY: User wants to see family or contact family.
- NAV_MEMORIES: User wants to see photos or memories.
- NAV_HELP: User is asking for emergency help or SOS.
- NAV_MESSAGES: User wants to see messages.
- STOP: User wants to stop speaking or audio.
- TIMELINE_WHATS_NOW: User asks "What is happening now?" or "What am I doing now?"
- TIMELINE_WHATS_NEXT: User asks "What is next?" or "What comes after?" or "What's coming up?"
- TIMELINE_TODAY_SUMMARY: User asks "What do I have today?" or "Tell me my day" or "What's my schedule?"
- TIMELINE_MISSED: User asks "What did I miss?" or "What have I not done?" or "Did I miss anything?"
- TIMELINE_WHEN_ITEM: User asks "When is lunch?" or "When is my medicine?" or "When is [specific event]?"
- TIMELINE_START_ACTIVITY: User says "Start my mind activity" or "Start brain exercise" or "Play a game."
- CHAT: User is just making conversation or asking a general question not covered above.

RESPONSE RULES:
- If timeline query: Give a short, factual answer using the PATIENT DAY CONTEXT above. Max 2-3 sentences.
- If navigation: Respond with a short confirmation in their language (e.g., "Opening your messages now").
- If chat: Give a helpful, short, simple, and respectful answer. DO NOT use technical words. Max 2-3 sentences.
- ALWAYS respond in the user's language, not English unless the user's language is English.
- Be warm, encouraging, and patient — the user is elderly.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            intent: {
              type: SchemaType.STRING,
              description: 'The classified intent from the INTENT OPTIONS list above.'
            },
            response: {
              type: SchemaType.STRING,
              description: 'Your verbal response back to the user, strictly in their requested language. Max 3 sentences.'
            }
          },
          required: ['intent', 'response']
        }
      }
    });

    const result = await model.generateContent(transcript);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return res.status(200).json({ success: true, intent: parsed.intent, response: parsed.response });
  } catch (error: any) {
    console.error('Voice Chat Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
