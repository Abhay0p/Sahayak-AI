# Game API QA Report

## Objective
Verify that the `useGameEngine` securely and accurately communicates with the backend APIs (`/api/games/score`, `/api/game/challenge`, etc.) and handles payloads correctly.

## Audit Results

### 1. Payload Structure
The frontend now correctly sends enriched metrics to the backend:
```json
{
  "gameId": "string",
  "score": "number",
  "accuracy": "number",
  "level": "number",
  "hintsUsed": "number",
  "attempts": "number",
  "gentleMode": "boolean"
}
```

### 2. Challenge Generator API
- Modified `fetchChallenge` across all games to pass `gentleMode` boolean, allowing backend generators to adjust data structures if necessary (e.g., smaller arrays).
- Updated `Pack the Bag` generator (`packTheBagGenerator.ts`) to return `correctIds` for the frontend hint system to utilize securely.

### 3. Novelty API Integration
- `noveltyEngine.ts` attempts to hit `/api/games/validate-novelty` and `/api/games/record-usage`.
- If the backend is unavailable (or not yet fully implemented), it falls back to a 100-item `localStorage` cache array to ensure zero disruption.

## Status
**PASSED**: Data flow between UI, Game Engine, and API routes is structured properly to support the new features.
