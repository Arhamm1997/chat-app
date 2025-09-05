const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'joinRoom',
  JOINED_ROOM: 'joinedRoom',
  LEAVE_ROOM: 'leaveRoom',
  SEND_MESSAGE: 'sendMessage',
  NEW_MESSAGE: 'newMessage',
  TYPING: 'typing',
  USER_TYPING: 'userTyping',
  USER_JOINED: 'userJoined',
  USER_LEFT: 'userLeft',
  USER_LIST_UPDATED: 'userListUpdated',
  ERROR: 'error'
};

module.exports = SOCKET_EVENTS;