const { customAlphabet } = require('nanoid');
const Message = require('./Message');

function ChatRoom(name, founder) {
  if (typeof name == 'object') {
    Object.assign(this, name);
  } else {
    this.id = customAlphabet('1234567890abcdef', 6);
    this.name = name;
    this.founder = founder; // user id of founder User
    this.users = [];
    this.messages = [];
    this.maxUsers = 200;

    // Add Founder as the first user!
    this.addUser(founder);
  }
}

ChatRoom.prototype = {
  userCount() {
    return this.users.length;
  },

  addUser(user) {
    // check if this user already is in the chat
    // we are actually only saving the user's id
    const u_index = this.users.findIndex((u) => u == user);

    if (u_index < 0) {
      this.users.push(user);
    }
  },

  removeUser(user) {
    const i = this.users.findIndex((u) => u == user);

    if (i > -1) {
      this.users.splice(i, 1);
    }
  },

  setName(name) {
    this.name = name;
  },

  newMessage({ user, user_id, msg, color, time }) {
    const m = new Message(user, user_id, this.id, msg, color, time);

    // TODO: save each message in the db...
    this.messages.push(m);
  },

  setMessages(messages) {
    this.messages = messages;
  },
};

module.exports = ChatRoom;
