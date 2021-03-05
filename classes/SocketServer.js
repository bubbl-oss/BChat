/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
function SocketServer(io, chat) {
  this.chat = chat;

  io.on('connection', function (socket) {
    // Ideally, we should check for cookies first before allowing connection ?
    // new user login
    console.log('Connected!');
    socket.on('user:login', async function () {
      const authenticated = socket.handshake.session.bubbl_chat_signedin;
      const nickname = socket.handshake.session.bubbl_chat_nickname;
      const user_id = socket.handshake.session.bubbl_chat_user_id;

      if (authenticated) {
        socket.user_id = user_id;
        socket.nickname = nickname;
        socket.emit('system:login-success', nickname);

        socket.emit('system:rooms', chat.getRooms());

        const u = await chat.getUser(user_id);

        socket.emit('system:user', u);

        io.emit(
          'system:all-users',
          nickname,
          chat.getUserCount(),
          'login',
          new Date()
        );
      } else {
        socket.emit('login-error');
      }
    });

    socket.on('user:new-room', async function (name) {
      const r = await chat.addRoom({
        name,
        founder: socket.user_id,
      });

      console.log(r);

      io.emit('system:new-room', r);
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

      const room = chat.getRoom(id);
      const user = await chat.getUser(socket.user_id);

      socket.emit('system:user', user); // for user
      io.emit('system:update-room', room); // for user
      io.to(id).emit('system:user-left-room', socket.user_id, id); // for other clients
      // io.to(id).emit('system:user-leaving-room', socket.user_id, id); // for members of room
    });

    socket.on('user:join-room', async function (id) {
      socket.join(id);

      socket.room = id;

      console.log('User joined room!', id);

      chat.addUserToRoom(socket.user_id, id);

      const room = chat.getRoom(id);
      const user_count = room.userCount();
      const user = await chat.getUser(socket.user_id);

      socket.emit('system:user', user); // update user

      console.log('User nickname!', socket.nickname);

      socket.emit(
        'system:joined-room',
        id,
        socket.nickname,
        socket.user_id,
        user_count,
        {
          user: 'System ',
          msg: `welcome to the room ${socket.nickname}`,
          color: 'green',
          time: new Date(),
        }
      ); // for user
      io.emit('system:update-room', room); // for user
      socket
        .to(id)
        .emit('system:user-joined-room', socket.user_id, id, user_count, {
          user: 'System ',
          msg: `${socket.nickname} joined the room`,
          color: 'red',
          time: new Date(),
        }); // for other clients
    });
    // new message get
    socket.on(
      'user:new-msg',
      function (msg, color, time, chatroom_id, user_id) {
        //   Get the ChatRoom and add this message...

        chat.newMessage(chatroom_id, {
          user: socket.nickname,
          user_id,
          msg,
          color,
          time,
        });

        socket
          .to(chatroom_id || socket.room)
          .emit('chatroom:new-msg', socket.nickname, msg, color, time, user_id);
      }
    );
    // new image get
    socket.on('user:img', function (imgData, color, room_id) {
      socket
        .to(room_id)
        .emit('chatroom:new-img', socket.nickname, imgData, color);
    });

    socket.on('user:change-nickname', async function (nickname) {
      const old = socket.nickname;
      const _new = nickname;

      // chat.changeUserNickname(socket.user_id, nickname);

      socket.nickname = _new;
      socket.emit('system:change-nickname', nickname);
      const user = await chat.getUser(socket.user_id);
      socket.emit('system:user', user); // update user
      io.to(socket.room).emit('system:new-nickname', {
        user: 'System ',
        msg: `${old} is now ${socket.nickname}`,
        color: 'red',
        time: new Date(),
      });
    });

    // user leaves
    socket.on('disconnect', async function () {
      console.log('Disconnecting user', socket.user_id, socket.nickname);
      if (socket.nickname != null) {
        console.log('disconnecting user...');

        const user = await chat.getUser(socket.user_id);

        // remove user from all their rooms...
        user.rooms.forEach((r) => {
          chat.removeUserFromRoom(socket.user_id, r.id || r);
        });

        chat.removeUser(socket.user_id);

        io.emit('system:user-disconnected', socket.user_id); // for user

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
