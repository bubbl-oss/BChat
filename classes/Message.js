const { customAlphabet } = require('nanoid');

function Message(
  user,
  user_id,
  room,
  msg,
  color = '#000',
  time,
  type = 'text'
) {
  if (typeof user == 'object') {
    Object.assign(this, user);
  } else {
    this.id = customAlphabet('1234567890abcdef', 8);
    this.type = type;
    this.user = user; // user's bchat nickname
    this.user_id = user_id; // user's bchat id
    this.msg = msg;
    this.color = color;
    this.room = room; // chatroom id
    this.time = time || new Date();
  }
}

Message.prototype = {};

module.exports = Message;
