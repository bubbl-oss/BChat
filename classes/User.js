function User(id, nickname, bubbl_username, color = '#000000') {
  if (typeof id == 'object') {
    // then we are using an Object to initialisse this User
    Object.assign(this, id);

    return this;
  } else {
    this.id = id;
    this.username = bubbl_username;
    this.nickname = nickname;
    this.color = color;
    this.rooms = [];
  }
}

User.prototype = {
  joinRoom: function (id) {
    this.rooms.push({ id, joined: new Date() });
  },
  leaveRoom: function (id) {
    let i = this.rooms.findIndex((r) => r.id == id);

    if (i > -1) {
      this.rooms.splice(i, 1);
    }
  },
  setNickname: function (nickname) {
    this.nickname = nickname;
  },
};

module.exports = User;
