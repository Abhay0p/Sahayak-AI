import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

export async function generateStoryChallenge(profileId: string, difficulty: number) {
  try {
    // 1. Fetch user memories
    const memories = await prisma.familyMemory.findMany({
      where: { elderlyId: profileId, gameUsageAllowed: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const memoryTexts = memories.map(m => m.description || m.title).filter(Boolean);
    const memoryContext = memoryTexts.length > 0 
      ? `User Memories to gently include if appropriate: \n${memoryTexts.join('\n')}`
      : `No specific memories. Create a general heartwarming story for an elderly Indian user.`;

    const pageCount = difficulty <= 2 ? 3 : (difficulty <= 4 ? 4 : 5);
    const sentenceComplexity = "Use simple, readable sentences.";

    // 2. Setup Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
      You are a storyteller creating a short, heartwarming interactive story for an elderly Indian user.
      ${memoryContext}
      ${sentenceComplexity}

      Create a short story with exactly ${pageCount} pages/segments.
      Ensure the story is culturally respectful, uplifting, and not confusing.
      Format MUST be a valid JSON array of objects with this exact structure:
      [
        {
          "pageNumber": 1,
          "text": "The text for this segment of the story."
        },
        ...
      ]
      DO NOT wrap the response in markdown blocks like \`\`\`json. Output ONLY raw JSON.
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Clean up markdown formatting if Gemini added it
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
    }
    
    const parsed = JSON.parse(responseText);

    // Basic schema validation
    if (!Array.isArray(parsed) || parsed.length !== pageCount) {
      throw new Error('Invalid AI Output Schema');
    }

    if (typeof parsed[0].text !== 'string' || !parsed[0].pageNumber) {
      throw new Error('Invalid AI Output Types');
    }

    return parsed;
  } catch (error) {
    console.error('AI Story Generation Failed:', error);
    return null; // The main engine will catch this and fallback to the Content Pool
  }
}
