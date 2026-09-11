export function generateMemoryMatchChallenge(difficulty: number) {
  const CATEGORIES = {
    fruits: ['🍎', '🍌', '🍇', '🍉', '🍓', '🥕', '🥔', '🍅', '🥥', '🍍', '🥭', '🍋'],
    nature: ['🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '🍀', '🍁', '🍂', '🍄', '🌺', '🌻'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'],
    everyday: ['🏠', '🚗', '⌚', '📱', '📸', '📺', '📻', '💡', '📚', '✏️', '🔑', ' umbrella'],
    cultural: ['🪔', '🥻', '🏏', '🛕', '🕌', '👳', '🐅', '🪷', '🥭', '🍵', '🛺', '🐘']
  };

  const keys = Object.keys(CATEGORIES);
  const selectedCategory = keys[Math.floor(Math.random() * keys.length)] as keyof typeof CATEGORIES;
  const pool = [...CATEGORIES[selectedCategory]].sort(() => 0.5 - Math.random());

  let pairCount = 4;
  if (difficulty === 2) pairCount = 6;
  else if (difficulty === 3) pairCount = 8;
  else if (difficulty === 4) pairCount = 10;
  else if (difficulty >= 5) pairCount = 12;

  const selectedItems = pool.slice(0, pairCount);
  
  // We don't shuffle here because the frontend handles the layout randomization 
  // so we can test novelty purely on the exact combination of icons used.
  // Actually, shuffling on frontend is fine, but passing the shuffled deck is easier.
  const deck = [...selectedItems, ...selectedItems]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
      }));

  return {
    category: selectedCategory,
    pairCount,
    deck
  };
}
