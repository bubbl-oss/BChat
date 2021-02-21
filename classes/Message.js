const { nanoid } = require('nanoid');

function Message(user, msg, room, time, type = 'text') {
  // We are checking if User is an object because the first and only attribute
  // could be a Message Object gotten from the Db for example...
  if (typeof user == 'object') {
    // then we are using an Object to initialisse this User
    Object.assign(this, nickname);
  } else {
    this.id = nanoid(7);
    this.type = type;
    this.user = user; // user id/nickname... not sure!
    this.msg = msg;
    this.room = room; // chat room id
    this.time = time || new Date();
  }
}

Message.prototype = {};

module.exports = Message;
