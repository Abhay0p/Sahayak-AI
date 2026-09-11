import { createHash } from 'crypto';
import { apiClient } from '@/lib/apiClient';

export type ChallengeContext = {
  userId: string;
  gameId: string;
  level: number;
};

/**
 * Creates a unique fingerprint for a challenge based on its core parameters.
 * Trivial changes (e.g. changing 'bazaar' to 'market' or swapping array elements)
 * should produce the same hash if they don't meaningfully change the challenge.
 */
export const createChallengeFingerprint = (content: any, type: string): string => {
  let normalizedContent = '';
  
  if (type === 'story') {
    // For stories, extract the core semantic facts. For now, normalize text heavily.
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    normalizedContent = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  } else if (type === 'sequence' || type === 'pattern') {
    // For sequences, sort elements to prevent trivial ordering changes from bypassing novelty
    if (Array.isArray(content)) {
      normalizedContent = [...content].sort().join('-');
    } else {
      normalizedContent = JSON.stringify(content);
    }
  } else {
    // Default fallback
    normalizedContent = JSON.stringify(content);
  }

  return createHash('sha256').update(`${type}:${normalizedContent}`).digest('hex');
};

/**
 * Validates a challenge fingerprint against the user's history.
 * Falls back to localStorage if the backend is unreachable.
 */
export const isChallengeNovel = async (fingerprint: string, context: ChallengeContext): Promise<boolean> => {
  try {
    // apiClient already parses JSON and returns the data object directly
    const data = await apiClient('/api/games/validate-novelty', {
      method: 'POST',
      body: JSON.stringify({ fingerprint, ...context }),
    });
    return data.isNovel ?? true;
  } catch (error) {
    console.warn('Failed to validate novelty against backend, falling back to local storage', error);
  }

  // Fallback to local storage for offline support
  if (typeof window !== 'undefined') {
    const historyKey = `sahayak_history_${context.userId}_${context.gameId}`;
    const pastHashes = JSON.parse(localStorage.getItem(historyKey) || '[]');
    if (pastHashes.includes(fingerprint)) {
      return false; // Not novel
    }
  }
  
  return true; // Default to novel if we can't check
};

/**
 * Records a challenge fingerprint into the user's history.
 */
export const recordChallengeUsage = async (fingerprint: string, context: ChallengeContext): Promise<void> => {
  try {
    await apiClient('/api/games/record-usage', {
      method: 'POST',
      body: JSON.stringify({ fingerprint, ...context }),
    });
  } catch (error) {
    console.warn('Failed to record usage to backend, falling back to local storage', error);
  }

  if (typeof window !== 'undefined') {
    const historyKey = `sahayak_history_${context.userId}_${context.gameId}`;
    const pastHashes = JSON.parse(localStorage.getItem(historyKey) || '[]');
    if (!pastHashes.includes(fingerprint)) {
      pastHashes.push(fingerprint);
      // Keep only last 100 to prevent unbounded growth in localStorage
      if (pastHashes.length > 100) pastHashes.shift();
      localStorage.setItem(historyKey, JSON.stringify(pastHashes));
    }
  }
};
