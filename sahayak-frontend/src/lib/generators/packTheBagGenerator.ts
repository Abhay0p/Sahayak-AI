export function generatePackTheBagChallenge(difficulty: number) {
  const SCENARIOS = [
    {
      scenario: 'Going to the Temple',
      correct: [
        { id: 'flowers', icon: '🌸', name: 'Flowers' },
        { id: 'incense', icon: '🪔', name: 'Incense' },
        { id: 'sweets', icon: '🍬', name: 'Sweets (Prasad)' },
      ],
      incorrect: [
        { id: 'laptop', icon: '💻', name: 'Laptop' },
        { id: 'passport', icon: '🛂', name: 'Passport' },
        { id: 'swimsuit', icon: '🩱', name: 'Swimsuit' },
        { id: 'football', icon: '⚽', name: 'Football' },
      ]
    },
    {
      scenario: 'Going to the Market',
      correct: [
        { id: 'bag', icon: '🛍️', name: 'Cloth Bag' },
        { id: 'wallet', icon: '👛', name: 'Wallet' },
        { id: 'list', icon: '📝', name: 'Shopping List' },
      ],
      incorrect: [
        { id: 'pillow', icon: '🛌', name: 'Pillow' },
        { id: 'tv', icon: '📺', name: 'TV Remote' },
        { id: 'shampoo', icon: '🧴', name: 'Shampoo' },
      ]
    },
    {
      scenario: 'Going for a Morning Walk',
      correct: [
        { id: 'shoes', icon: '👟', name: 'Walking Shoes' },
        { id: 'water', icon: '💧', name: 'Water Bottle' },
        { id: 'stick', icon: '🦯', name: 'Walking Stick' },
      ],
      incorrect: [
        { id: 'fryingpan', icon: '🍳', name: 'Frying Pan' },
        { id: 'book', icon: '📖', name: 'Heavy Book' },
        { id: 'laptop', icon: '💻', name: 'Laptop' },
      ]
    }
  ];

  const pool = [...SCENARIOS].sort(() => 0.5 - Math.random());
  const selected = pool[0];
  
  let requiredCount = 2;
  let distractorCount = 2;
  
  if (difficulty === 2) {
    requiredCount = 3;
    distractorCount = 3;
  } else if (difficulty >= 3) {
    requiredCount = 3;
    distractorCount = 4;
  }

  const correctItems = selected.correct.slice(0, requiredCount);
  const incorrectItems = selected.incorrect.slice(0, distractorCount);
  
  const options = [...correctItems, ...incorrectItems].sort(() => 0.5 - Math.random());

  return {
    scenario: selected.scenario,
    options,
    requiredCount,
    correctIds: correctItems.map(item => item.id)
  };
}
