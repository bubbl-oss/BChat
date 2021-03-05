const ChatRoom = require('./ChatRoom');
const User = require('./User');

function ChatServer(db) {
  this.Db = db;
  this.rooms = [];
  this.users = []; // here we are saving the actual user object.
}

ChatServer.prototype = {
  async loadData() {
    const all_users = await this.Db.users.find({});

    const us = all_users.map((u) => new User(u));

    this.setUsers(us);

    const all_rooms = await this.Db.rooms.find({});

    const rs = all_rooms.map((r) => new ChatRoom(r));

    this.setRooms(rs);
  },
  addUser({ id, nickname, bubbl_username }) {
    const u_index = this.users.findIndex((u) => u.id == id);

    if (u_index < 0) {
      const user = new User(id, nickname, bubbl_username);
      this.users.push(user);
      return user;
    }
  },
  deleteAllUsers() {
    this.Db.users.remove({}, { multi: true });
    this.users = [];
  },
  deleteAllRooms() {
    this.Db.rooms.remove({}, { multi: true });
    this.rooms = [];
  },
  removeUser(id) {
    const i = this.users.findIndex((u) => u.id == id);

    if (i > -1) {
      this.users.splice(i, 1);
    }
  },
  addUserToRoom(user_id, room_id) {
    // find user in whole system! lol
    const u_index = this.users.findIndex((u) => u.id == user_id);
    const r_index = this.rooms.findIndex((r) => r.id == room_id);

    // if user exists and room exists!
    if (u_index > -1 && r_index > -1) {
      this.users[u_index].joinRoom(room_id);
      this.rooms[r_index].addUser(user_id);

      this.Db.users.update(
        { id: user_id },
        { $push: { rooms: { id: room_id, joined: new Date() } } }
      );
      this.Db.rooms.update({ id: room_id }, { $push: { users: user_id } });
    }
  },
  removeUserFromRoom(user_id, room_id) {
    // find user in whole system! lol
    const u_index = this.users.findIndex((u) => u.id == user_id);
    const r_index = this.rooms.findIndex((r) => r.id == room_id);

    // if user is found and room exists!
    if (u_index > -1 && r_index > -1) {
      this.users[u_index].leaveRoom(room_id);
      this.rooms[r_index].removeUser(user_id);

      this.Db.users.update(
        { id: user_id },
        { $pull: { rooms: { id: room_id } } }
      );
      this.Db.rooms.update({ id: room_id }, { $pull: { users: user_id } });
    }
  },
  async removeRoom(id) {
    const i = this.rooms.findIndex((r) => r.id == id);

    if (i > -1) {
      this.rooms.splice(i, 1);
      await this.Db.rooms.remove({ id });
      return true;
    }

    return false;
  },
  async addRoom({ name, founder }) {
    const r_index = this.rooms.findIndex((r) => r.name == name);

    if (r_index < 0) {
      const room = new ChatRoom(name, founder);

      try {
        await this.Db.rooms.insert(room);
      } catch (err) {
        console.error('Error saving room => ', err);
      }

      this.rooms.push(room);

      return room;
    }
  },
  newMessage(room, msg_data) {
    const _room = this.rooms.find((r) => r.id == room);

    if (_room) {
      this.Db.rooms.update({ id: _room.id }, { $push: { messages: msg_data } });
      _room.newMessage(msg_data);
    }
  },
  async changeUserNickname(user_id, nickname) {
    const u = await this.getUser(user_id);

    if (u) {
      u.setNickname(nickname);
      await this.Db.users.update({ id: user_id }, { $set: { nickname } });
    }
  },
  setUsers(users) {
    if (Array.isArray(users)) {
      this.users = users;
    }
  },
  setRooms(rooms) {
    if (Array.isArray(rooms)) {
      this.rooms = rooms;
    }
  },
  getRooms(from = 'local') {
    if (from == 'db') return this.Db.rooms.find({});

    return this.rooms;
  },
  getUsers(from = 'local') {
    if (from == 'db') return this.Db.users.find({});

    return this.users;
  },
  getUserCount() {
    return this.users.length;
  },
  getRoom(id) {
    return this.rooms.find((r) => r.id == id);
  },
  async getRoomDb(id) {
    return this.Db.rooms.findOne({ id });
  },
  async getUser(id) {
    const u2 = this.users.find((u) => u.id == id);

    if (u2) {
      return u2;
    }

    return this.Db.users
      .findOne({ id })
      .then((u) => {
        if (u) {
          const u1 = new User(u);

          this.users.push(u1);

          return u1;
        }
      })
      .catch((err) => console.log('Error fetching user: ', err));
  },
};

module.exports = ChatServer;
