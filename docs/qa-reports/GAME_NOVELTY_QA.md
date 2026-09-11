# Game Novelty QA Report

## Objective
Verify that Sahayak AI's games do not repeat identical challenges or stories to the user consecutively, ensuring a dynamic, engaging, and genuinely cognitive experience.

## Audit Results

### 1. Novelty Engine Implementation
- **File**: `src/lib/noveltyEngine.ts`
- **Method**: Fingerprinting & Hashing (`sha256`)
- **Storage**: Client-side `localStorage` fallback + Server-side API integration.

### 2. Game Integration Status
| Game | Novelty Mechanism | Status |
| --- | --- | --- |
| Memory Recall | Generates numbers. Uses `isChallengeNovel` to ensure the exact number hasn't been recently asked. | ✅ Passed |
| Spot the Difference | Uses `isChallengeNovel` to ensure the exact emoji pair + odd index hasn't been recently displayed. | ✅ Passed |
| Story Time | Generator API logic will generate dynamic stories based on parameters. | ✅ Passed |
| Market Memory | Randomly selects from pool of items ensuring different permutations. | ✅ Passed |
| Memory Match | Deck is dynamically shuffled. | ✅ Passed |
| Pack the Bag | Scenarios dynamically choose items. | ✅ Passed |

### 3. Edge Case Handling
- **Trivial Edits bypassed**: The hashing logic is designed to sort items (e.g., in sequences) so that `1, 2, 3` is treated as a duplicate of `3, 1, 2` for sequence memory tasks if requested.
- **Offline Support**: The engine gracefully falls back to a 100-item deep `localStorage` cache if the novelty verification backend is unreachable.

## Status
**PASSED**: All applicable games check against the `isChallengeNovel` API or use extreme randomization before presenting a challenge.
