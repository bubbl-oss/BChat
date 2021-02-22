const ChatRoom = require('./ChatRoom');
const User = require('./User');

function ChatServer(db) {
  console.log('Started Chat Server');
  this.Db = db;
  this.rooms = [];
  this.users = []; // here we are saving the actual user object.
}

ChatServer.prototype = {
  loadData: async function () {
    const all_users = await this.Db.users.find({});

    const us = all_users.map((u) => new User(u));

    this.setUsers(us);

    const all_rooms = await this.Db.rooms.find({});

    const rs = all_rooms.map((r) => new ChatRoom(r));

    this.setRooms(rs);
  },
  addUser: function ({ id, nickname, bubbl_username, color }) {
    let u = this.users.findIndex((u) => u.id == id);

    if (u < 0) {
      let user = new User(id, nickname, bubbl_username);
      this.users.push(user);
      return user;
    }
  },
  deleteAllUsers: function () {
    this.Db.users.remove({}, { multi: true });
    this.users = [];
  },
  deleteAllRooms: function () {
    this.Db.rooms.remove({}, { multi: true });
    this.rooms = [];
  },
  removeUser: function (id) {
    let i = this.users.findIndex((u) => u.id == id);

    if (i > -1) {
      this.users.splice(i, 1);
    }
  },
  addUserToRoom: function (user_id, room_id, nickname) {
    // Change this before going live back to ID
    let u = this.users.findIndex((u) => u.nickname == nickname);
    let r = this.rooms.findIndex((r) => r.id == room_id);

    if (u > -1 && r > -1) {
      this.users[u].joinRoom(room_id);
      this.rooms[r].addUser(user_id);
    }
  },
  removeUserFromRoom: function (user_id, room_id) {
    let u = this.users.findIndex((u) => u.id == user_id);
    let r = this.rooms.findIndex((r) => r.id == room_id);

    if (u > -1 && r > -1) {
      this.users[u].leaveRoom(room_id);
      this.rooms[r].removeUser(user_id);
    }
  },
  removeRoom: async function (id) {
    let i = this.rooms.findIndex((r) => r.id == id);

    if (i > -1) {
      this.rooms.splice(i, 1);
      await this.Db.rooms.remove({ id });
      return true;
    }

    return false;
  },
  addRoom: async function ({ name, founder }) {
    let r = this.rooms.findIndex((r) => r.name == name);

    if (r < 0) {
      let room = new ChatRoom(name, founder);

      try {
        await this.Db.rooms.insert(room);
      } catch (err) {
        console.error('Error saving room => ', err);
      }

      this.rooms.push(room);

      return room;
    }
  },
  newMessage: function (room, msg_data) {
    let r = this.rooms.find((r) => r.id == room);

    if (r) {
      r.newMessage(msg_data);
    }
  },
  changeUserNickname: async function (user_id, nickname) {
    let u = await this.getUser(user_id);

    if (u) {
      u.setNickname(nickname);
      await this.Db.users.update(
        { id: user_id },
        { $set: { nickname: nickname } }
      );
    }
  },
  setUsers: function (users) {
    if (Array.isArray(users)) {
      this.users = users;
    }
  },
  setRooms: function (rooms) {
    if (Array.isArray(rooms)) {
      this.rooms = rooms;
    }
  },
  getRooms: function () {
    return this.rooms;
  },
  getUsers: function () {
    return this.users;
  },
  getUserCount: function () {
    return this.users.length;
  },
  getRoom: function (id) {
    return this.rooms.find((r) => r.id == id);
  },
  getUser: async function (id) {
    let u2 = this.users.find((u) => u.id == id);

    if (u2) {
      return u2;
    }

    return this.Db.users
      .findOne({ id })
      .then((u) => {
        if (u) {
          let u1 = new User(u);

          this.users.push(u1);

          return u1;
        }
      })
      .catch((err) => console.log('Error fetching user: ', err));
  },
};

module.exports = ChatServer;
