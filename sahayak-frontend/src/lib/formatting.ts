export function formatGameName(rawName: string): string {
  if (!rawName) return '';
  const standardizedNames: Record<string, string> = {
    'memory-match': 'Memory Match',
    'memory-recall': 'Memory Recall',
    'spot-the-difference': 'Spot the Difference',
    'pattern-detective': 'Pattern Detective',
    'my-daily-story': 'My Daily Story',
    'market-memory': 'Market Memory',
    'pack-the-bag': 'Pack the Bag',
    'remember-the-place': 'Remember the Place',
    'sound-detective': 'Sound Detective',
    'sequence-master': 'Sequence Master',
    'whats-missing': 'What\'s Missing?',
    'memory-stories': 'Memory Stories',
    'family-memory': 'Family Memory',
    'memory-challenge': 'Memory Challenge',
    'pattern detect': 'Pattern Detective' // specifically mentioned in prompt
  };
  
  const normalized = rawName.toLowerCase().trim();
  if (standardizedNames[normalized]) {
    return standardizedNames[normalized];
  }

  // Fallback: Title Case
  return rawName.split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatDifficulty(level: number | string): string {
  const lvl = typeof level === 'string' ? parseInt(level, 10) : level;
  switch (lvl) {
    case 1: return 'Easy';
    case 2: return 'Medium';
    case 3: return 'Hard';
    case 4: return 'Expert';
    default: return 'Easy';
  }
}

export function formatDateFriendly(dateString: string | Date, userTimezone: string = 'UTC'): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: userTimezone });

  if (isToday) {
    return `Today, ${timeString}`;
  }

  const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: userTimezone });
  return `${dateStr}, ${timeString}`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return '—';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes === 0) {
    return `${remainingSeconds} sec`;
  }
  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }
  return `${minutes} min ${remainingSeconds} sec`;
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return '0 / 100';
  return `${score} / 100`;
}

export function formatPercentage(value: number | null | undefined): string {
  if (value == null) return '0%';
  return `${Math.round(value)}%`;
}
