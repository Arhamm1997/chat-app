// src/utils/usernameGenerator.js
const adjectives = [
  'Shadow', 'Silent', 'Dark', 'Mystic', 'Ghost', 'Stealth', 'Cyber', 'Neon',
  'Electric', 'Blazing', 'Swift', 'Clever', 'Brave', 'Bold', 'Fierce', 'Wild',
  'Storm', 'Thunder', 'Lightning', 'Frost', 'Fire', 'Ice', 'Crystal', 'Diamond',
  'Golden', 'Silver', 'Crimson', 'Azure', 'Emerald', 'Violet', 'Cosmic', 'Stellar'
];

const nouns = [
  'Wolf', 'Eagle', 'Lion', 'Tiger', 'Dragon', 'Phoenix', 'Raven', 'Hawk',
  'Viper', 'Panther', 'Falcon', 'Shark', 'Bear', 'Fox', 'Lynx', 'Cobra',
  'Knight', 'Warrior', 'Hunter', 'Ranger', 'Scout', 'Guardian', 'Sentinel', 'Champion',
  'Ninja', 'Samurai', 'Assassin', 'Phantom', 'Specter', 'Wraith', 'Spirit', 'Soul'
];

const generateUsername = () => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective}${noun}${number}`;
};

module.exports = {
  generateUsername,
  adjectives,
  nouns
};
