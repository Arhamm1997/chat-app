
const generateRoomId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const generateUserId = () => {
  return Math.random().toString(36).substr(2, 9);
};

module.exports = {
  generateRoomId,
  generateUserId
};
