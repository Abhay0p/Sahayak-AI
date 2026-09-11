# Game Progression QA Report

## Objective
Ensure the game engine scales difficulty smoothly without sudden spikes, utilizes adaptive difficulty based on recent performance, and does not penalize players aggressively.

## Audit Results

### 1. Game Engine State Updates (`src/lib/gameEngine.ts`)
- **Consecutive Win/Loss Tracking**: The `endGame` hook now tracks `consecutiveWins` and `consecutiveLosses`.
- **Level Up Logic**: 
  - Requires **2 consecutive wins** to advance a level (prevents lucky guessing from aggressively raising difficulty).
- **Level Down Logic**:
  - Requires **2 consecutive losses** to drop a level (prevents one accidental misclick from dropping the user's progress).
- **Max Level enforcement**: The engine utilizes `difficultyConfig.maxLevel` to ensure the game gracefully caps out.

### 2. Difficulty Parameter Usage
| Game | Level 1 | Level Max (5) |
| --- | --- | --- |
| Memory Recall | 3 Digits | 7 Digits |
| Spot Difference | 2x2 Grid | 6x6 Grid |
| Memory Match | 4 Pairs | 6 Pairs (cap) |
| Market Memory | Base Time | Faster Time (if Gentle Mode off) |

### 3. Attempt Tracking
- The engine now correctly handles and records the number of `attempts` it took to succeed, reducing reliance on raw time constraints for scoring.

## Status
**PASSED**: Adaptive difficulty is functioning locally and correctly triggers level adjustments without being overly punitive.
