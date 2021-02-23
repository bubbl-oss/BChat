function User(id, nickname, bubbl_username, color = '#000000') {
  if (typeof id == 'object') {
    Object.assign(this, id);
    return this;
  }
  this.id = id;
  this.username = bubbl_username;
  this.nickname = nickname;
  this.color = color;
  this.rooms = [];
}

User.prototype = {
  joinRoom(id) {
    this.rooms.push({ id, joined: new Date() });
  },
  leaveRoom(id) {
    const i = this.rooms.findIndex((r) => r.id == id);

    if (i > -1) {
      this.rooms.splice(i, 1);
    }
  },
  setNickname(nickname) {
    this.nickname = nickname;
  },
};

module.exports = User;
