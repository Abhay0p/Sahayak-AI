export function generateWordJumbleChallenge(difficulty: number) {
  // A much larger, categorized pool of words
  const WORD_POOL = {
    1: [
      { word: 'CAT', hint: 'A small pet' },
      { word: 'DOG', hint: 'Man\'s best friend' },
      { word: 'SUN', hint: 'It shines in the sky' },
      { word: 'TEA', hint: 'A popular hot drink' },
      { word: 'CUP', hint: 'You drink tea from this' }
    ],
    2: [
      { word: 'WATER', hint: 'You drink this to stay hydrated' },
      { word: 'APPLE', hint: 'A red or green fruit' },
      { word: 'RIVER', hint: 'Flowing body of water' },
      { word: 'HOUSE', hint: 'Where you live' },
      { word: 'MANGO', hint: 'King of fruits' },
      { word: 'LOTUS', hint: 'National flower of India' }
    ],
    3: [
      { word: 'TEMPLE', hint: 'A place of worship' },
      { word: 'MARKET', hint: 'Where you buy vegetables' },
      { word: 'GARDEN', hint: 'Where flowers bloom' },
      { word: 'SUMMER', hint: 'The hot season' },
      { word: 'FAMILY', hint: 'Your relatives' }
    ],
    4: [
      { word: 'MORNING', hint: 'The start of the day' },
      { word: 'FESTIVAL', hint: 'A time of celebration' },
      { word: 'VILLAGE', hint: 'A small rural settlement' },
      { word: 'JOURNEY', hint: 'Traveling from one place to another' }
    ],
    5: [
      { word: 'BEAUTIFUL', hint: 'Very pleasing to look at' },
      { word: 'TRADITION', hint: 'Customs passed down' },
      { word: 'BREAKFAST', hint: 'First meal of the day' },
      { word: 'HAPPINESS', hint: 'Feeling of joy' }
    ]
  };

  const safeDifficulty = Math.min(Math.max(difficulty, 1), 5) as 1|2|3|4|5;
  const pool = WORD_POOL[safeDifficulty];
  const selected = pool[Math.floor(Math.random() * pool.length)];

  let shuffled = selected.word.split('').sort(() => 0.5 - Math.random()).join('');
  while (shuffled === selected.word && selected.word.length > 1) {
    shuffled = selected.word.split('').sort(() => 0.5 - Math.random()).join('');
  }

  return {
    word: selected.word,
    jumbled: shuffled,
    hint: selected.hint
  };
}
