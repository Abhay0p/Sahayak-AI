export function generateMarketMemoryChallenge(difficulty: number) {
  const MARKET_ITEMS = [
    { id: 'apple', icon: '🍎', name: 'Apples' },
    { id: 'banana', icon: '🍌', name: 'Bananas' },
    { id: 'carrot', icon: '🥕', name: 'Carrots' },
    { id: 'potato', icon: '🥔', name: 'Potatoes' },
    { id: 'tomato', icon: '🍅', name: 'Tomatoes' },
    { id: 'onion', icon: '🧅', name: 'Onions' },
    { id: 'garlic', icon: '🧄', name: 'Garlic' },
    { id: 'milk', icon: '🥛', name: 'Milk' },
    { id: 'bread', icon: '🍞', name: 'Bread' },
    { id: 'egg', icon: '🥚', name: 'Eggs' },
    { id: 'tea', icon: '🍵', name: 'Tea Leaves' },
    { id: 'rice', icon: '🍚', name: 'Rice' },
  ];

  const pool = [...MARKET_ITEMS].sort(() => 0.5 - Math.random());
  
  let listSize = 3;
  if (difficulty === 2) listSize = 4;
  else if (difficulty === 3) listSize = 5;
  else if (difficulty === 4) listSize = 6;
  else if (difficulty >= 5) listSize = 7;

  const shoppingList = pool.slice(0, listSize);
  
  // The distractors are the items not in the shopping list
  const distractors = pool.slice(listSize, listSize + 5); 
  
  const options = [...shoppingList, ...distractors].sort(() => 0.5 - Math.random());

  return {
    shoppingList,
    options,
    listSize
  };
}
