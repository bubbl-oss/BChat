const { nanoid } = require('nanoid');
const Message = require('./Message');

function ChatRoom(name, founder) {
  if (typeof name == 'object') {
    Object.assign(this, name);
  } else {
    this.id = nanoid(5);
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
  userCount: function () {
    return this.users.length;
  },

  addUser: function (user) {
    // check if this user already is in the chat
    // we are actually only saving the user's id
    let u = this.users.findIndex((u) => u == user);

    if (u < 0) {
      this.users.push(user);
    }
  },

  removeUser: function (user) {
    for (var i = 0; i < this.users.length; i++) {
      if (this.users[i] == user) {
        this.users.splice(i, 1);
        break;
      }
    }
  },

  setName: function (name) {
    this.name = name;
  },

  newMessage: function ({ user, msg, time, color }) {
    let m = new Message(user, msg, this.id, time, color);

    // TODO: find out if the loop is slow!
    this.messages.push(m);

    console.log(m);
  },

  setMessages: function (messages) {
    this.messages = messages;
  },
};

module.exports = ChatRoom;
