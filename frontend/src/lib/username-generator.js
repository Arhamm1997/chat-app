//src/lib/username-generator.ts
const adjectives = [
  'Shadow', 'Silent', 'Dark', 'Mystic', 'Ghost', 'Stealth', 'Cyber', 'Neon',
  'Electric', 'Blazing', 'Swift', 'Clever', 'Brave', 'Bold', 'Fierce', 'Wild',
  'Storm', 'Thunder', 'Lightning', 'Frost', 'Fire', 'Ice', 'Crystal', 'Diamond',
  'Golden', 'Silver', 'Crimson', 'Azure', 'Emerald', 'Violet', 'Cosmic', 'Stellar',
  'Phantom', 'Raven', 'Wolf', 'Eagle', 'Dragon', 'Phoenix', 'Viper', 'Falcon',
  'Ninja', 'Samurai', 'Knight', 'Warrior', 'Hunter', 'Guardian', 'Sentinel', 'Champion'
];

const nouns = [
  'Wolf', 'Eagle', 'Lion', 'Tiger', 'Dragon', 'Phoenix', 'Raven', 'Hawk',
  'Viper', 'Panther', 'Falcon', 'Shark', 'Bear', 'Fox', 'Lynx', 'Cobra',
  'Knight', 'Warrior', 'Hunter', 'Ranger', 'Scout', 'Guardian', 'Sentinel', 'Champion',
  'Ninja', 'Samurai', 'Assassin', 'Phantom', 'Specter', 'Wraith', 'Spirit', 'Soul',
  'Blade', 'Arrow', 'Storm', 'Thunder', 'Lightning', 'Flame', 'Frost', 'Star'
];

export function generateUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective}${noun}${number}`;
}

export function generateMultipleUsernames(count: number = 5): string[] {
  const usernames = new Set<string>();
  
  while (usernames.size < count) {
    usernames.add(generateUsername());
  }
  
  return Array.from(usernames);
}

export { adjectives, nouns };