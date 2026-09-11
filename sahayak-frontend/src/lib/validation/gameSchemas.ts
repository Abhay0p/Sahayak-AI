// src/lib/validation/gameSchemas.ts
// Compatible with Zod v4

import { z } from 'zod';

// Base schema for any game content (extendable)
export const baseContentSchema = z.object({});

export const marketMemorySchema = z
  .object({
    items: z.array(z.string()).min(1, { message: 'Items must be a non-empty array' }),
    correctAnswer: z.string(),
  })
  .refine((data) => data.items.includes(data.correctAnswer), {
    message: 'Correct answer must exist in items',
    path: ['correctAnswer'],
  });

export const memoryRecallSchema = z.object({
  numbers: z.array(z.number()).min(1, { message: 'Numbers array cannot be empty' }),
  displayTime: z.number().positive({ message: 'Display time must be positive' }),
});

export const spotDifferenceSchema = z.object({
  imageA: z.string().url({ message: 'imageA must be a valid URL' }),
  imageB: z.string().url({ message: 'imageB must be a valid URL' }),
  differences: z.array(
    z.object({
      x: z.number(),
      y: z.number(),
      radius: z.number().positive(),
    })
  ).min(1, { message: 'At least one difference must be defined' }),
});

export const patternDetectiveSchema = z.object({
  sequence: z.array(z.string()).min(2, { message: 'Sequence must have at least 2 elements' }),
  correctNext: z.string(),
});

export const sequenceMasterSchema = z.object({
  sequence: z.array(z.number()).min(2),
  answer: z.number(),
});

export const soundDetectiveSchema = z.object({
  audioUrl: z.string(),
  options: z.array(z.string()).min(2),
  correctAnswer: z.string(),
});

// Generic MCQ schema used by many games
export const mcqSchema = z
  .object({
    question: z.string().min(1),
    options: z.array(z.string()).min(2, { message: 'At least 2 options required' }),
    correctAnswer: z.string(),
  })
  .refine((d) => d.options.includes(d.correctAnswer), {
    message: 'correctAnswer must be one of the options',
    path: ['correctAnswer'],
  });

// Map of game type to its validation schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const gameSchemaMap: Record<string, z.ZodType<any>> = {
  market_memory: marketMemorySchema,
  memory_recall: memoryRecallSchema,
  spot_difference: spotDifferenceSchema,
  pattern_detective: patternDetectiveSchema,
  sequence_master: sequenceMasterSchema,
  sound_detective: soundDetectiveSchema,
  // generic MCQ games
  memory_match: mcqSchema,
  pack_the_bag: mcqSchema,
  remember_the_place: mcqSchema,
  whats_missing: mcqSchema,
  memory_stories: mcqSchema,
  family_memory: mcqSchema,
  memory_challenge: mcqSchema,
  daily_story: mcqSchema,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateGameContent(gameType: string, content: any) {
  const schema = gameSchemaMap[gameType];
  if (!schema) {
    // Unknown game type — accept without schema validation
    return { success: true, data: content };
  }
  return schema.safeParse(content);
}
