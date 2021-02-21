function SocketServer(io, chat) {
  this.chat = chat;

  io.on('connection', function (socket) {
    // Ideally, we should check for cookies first before allowing connection ?
    //new user login
    console.log('Connected!');
    socket.on('user:login', async function () {
      const authenticated = socket.handshake.session.bubbl_chat_signedin;
      const nickname = socket.handshake.session.nickname;
      const user_id = socket.handshake.session.bubbl_chat_user_id;

      if (authenticated) {
        socket.user_id = user_id;
        socket.nickname = nickname;
        socket.emit('system:login-success', nickname);

        socket.emit('system:rooms', chat.getRooms());

        let u = await chat.getUser(user_id);

        socket.emit('system:user', u);

        io.sockets.emit(
          'system:all-users',
          nickname,
          chat.getUserCount(),
          'login',
          new Date().getTime()
        );
      } else {
        socket.emit('login-error');
      }
    });

    socket.on('user:new-room', async function (name) {
      let r = await chat.addRoom({
        name,
        founder: socket.user_id,
      });

      console.log(r);

      io.sockets.emit('system:new-room', r);
    });

    socket.on('user:delete-room', async function (id) {
      console.log('Removing room!');

      const status = await chat.removeRoom(id);
      chat.removeUserFromRoom(socket.user_id, id);
      console.log(status);

      io.emit('system:room-deleted', id);
    });

    socket.on('user:leave-room', async function (id) {
      console.log('User Leaving room!');

      chat.removeUserFromRoom(socket.user_id, id);

      socket.leave(id);

      socket.emit('system:left-room', id); // for user
      io.to(id).emit('system:user-left-room', socket.user_id, id); // for other clients
      // io.to(id).emit('system:user-leaving-room', socket.user_id, id); // for members of room
    });

    socket.on('user:join-room', function (id) {
      socket.join(id);

      socket.room = id;

      console.log('User joined room!', id);

      chat.addUserToRoom(socket.user_id, id);

      const room = chat.getRoom(id);
      const user_count = room.userCount();

      console.log('User nickname!', socket.nickname);

      socket.emit('system:joined-room', id, socket.nickname, user_count, {
        user: 'System ',
        msg: `welcome to the room ${socket.nickname}`,
        color: 'green',
        time: new Date(),
      }); // for user
      socket.emit('system:room', room); // for user
      socket
        .to(id)
        .emit('system:user-joined-room', socket.user_id, id, user_count, {
          user: 'System ',
          msg: `${socket.nickname} joined the room`,
          color: 'red',
          time: new Date(),
        }); // for other clients
    });
    //new message get
    socket.on('user:new-msg', function (msg, time, color, chatroom_id) {
      //   Get the ChatRoom and add this message...

      chat.newMessage(chatroom_id, {
        user: socket.nickname,
        msg,
        time,
        color,
      });

      console.log('Chat room => ', chatroom_id);

      socket
        .to(chatroom_id || socket.room)
        .emit('chatroom:new-msg', socket.nickname, msg, color, time);
    });
    //new image get
    socket.on('user:img', function (imgData, color, room_id) {
      socket
        .to(room_id)
        .emit('chatroom:new-img', socket.nickname, imgData, color);
    });

    socket.on('user:change-nickname', function (nickname) {
      let old = socket.nickname;
      let _new = nickname;

      chat.changeUserNickname(socket.user_id, nickname);

      socket.nickname = _new;
      socket.handshake.session.nickname = _new;
      console.log(socket.handshake.session.nickname, socket.nickname);
      socket.emit('system:change-nickname', nickname);
      io.to(socket.room).emit('system:new-nickname', {
        user: 'System ',
        msg: `${old} is now ${socket.nickname}`,
        color: 'red',
        time: new Date(),
      });
    });

    //user leaves
    socket.on('disconnect', function () {
      if (socket.nickname != null) {
        console.log('disconnecting user...');
        chat.removeUser(socket.user_id);

        socket.to(socket.room).emit('system:disconnect', 'disconnect', {
          user: 'System ',
          msg: `${socket.nickname} left the chat.`,
          color: 'blue',
          time: new Date(),
        });
      }
    });
  });
}

module.exports = SocketServer;
