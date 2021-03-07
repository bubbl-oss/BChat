/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-inner-declarations */
if (document.getElementById('vue-app')) {
  const data = {
    activeTab: 0,
    chatLoaded: false,
    rooms: [],
  };

  const routes = [
    { path: '', redirect: '/lobby' },
    { path: '/lobby', component: LobbyComponent, name: 'Lobby' },
    {
      path: '/room/:id',
      component: ChatroomComponent,
      name: 'Chatroom',
    },
  ];

  // 3. Create the router instance and pass the `routes` option
  // You can pass in additional options here, but let's
  // keep it simple for now.
  const router = new VueRouter({
    routes, // short for `routes: routes`
  });

  // Vuex store
  const store = new Vuex.Store({
    state: {
      count: 0,
      chatsLoaded: false,
      user: {},
      rooms: [],
    },
    getters: {
      chatsLoaded: (state) => {
        return state.chatsLoaded;
      },
      rooms: (state) => {
        return state.rooms;
      },
      room: (state) => (id) => {
        return state.rooms.find((r) => r.id === id);
      },
      user: (state) => {
        return state.user;
      },
    },
    mutations: {
      increment(state) {
        state.count++;
      },
      toggleChat(state, status) {
        state.chatsLoaded = status;
      },
      newRoom(state, room) {
        state.rooms.push(room);
      },
      setRooms(state, rooms) {
        state.rooms = rooms;
      },
      setUser(state, user) {
        state.user = user;
      },
      setRoomUserJoined(state, room) {
        state.user.rooms.push(room);
      },
      addUserToRoom(state, { user_id, room_id }) {
        let user = state.user.findIndex((u) => u.id == user_id);
        let room = state.rooms.findIndex((r) => r.id == room_id);

        if (room > -1) {
          state.user.rooms.push({ id: room_id, joined: new Date() });
          state.rooms[room].users.push(user_id);
        }

        // if (room > 0 && user) {
        //   state.rooms.users.splice(user, 1);
        // }
      },
      updateRoom(state, room) {
        let room_index = state.rooms.findIndex((r) => r.id == room.id);
        // let user = state.rooms[room].users.findIndex((u) => u.id == user_id);

        if (room_index > -1) {
          // state.rooms[room_index] = room;
          Object.assign(state.rooms[room_index], room);
        }
      },
      removeUserFromRoom(state, { user_id, room_id }) {
        if (state.user.id == user_id) {
          // it is user that has left...
          let i = state.user.rooms.findIndex((r) => r.id == room_id);
          let r_i = state.rooms[i].users.findIndex(
            (u) => u.id == state.user.id
          );

          if (i > 0 && r_i) {
            state.user.rooms.splice(i, 1);
            state.rooms.users.splice(r_i, 1);
          }

          return;
        }

        let room = state.rooms.findIndex((r) => r.id == room_id);
        let user = state.rooms[room].users.findIndex((u) => u.id == user_id);

        if (room > 0 && user) {
          state.rooms.users.splice(user, 1);
        }
      },
      removeRoom(state) {
        let i = state.user.rooms.findIndex((r) => r.id == room_id);

        if (i > 0) {
          state.rooms.splice(i, 1);
        }
      },
      changeNickname(state, n) {
        state.user.nickname = n;
      },
    },
  });

  const computed = {
    route: function () {
      return this.$route.name;
    },
  };

  // 4. Create and mount the root instance.
  // Make sure to inject the router with the router option to make the
  // whole app router-aware.

  const App = new Vue({
    data,
    router,
    computed,
    store,
    components: {
      lobby: LobbyComponent,
      chatroom: ChatroomComponent,
    },
    mounted() {
      console.log('App Loaded!');

      if (window.startChat) {
        window.startChat();
        window.Chat.init();

        this.chatLoaded = true;
        this.$store.commit('toggleChat', true);

        window.Chat.socket.on('system:rooms', function (rooms) {
          console.log(rooms);
          store.commit('setRooms', rooms);
        });

        window.Chat.socket.on('system:user', function (user) {
          console.log('setting user =>', user);
          store.commit('setUser', user);
        });

        // window.Chat.socket.on('system:joined-room', function (u, r) {
        //   console.log(r);
        //   store.commit('addUserToRoom', { user_id: u, room: r });
        // });

        // window.Chat.socket.on('system:user-left-room', function (u, r) {
        //   console.log(r);
        //   store.commit('removeUserFromRoom', { user_id: u, room_id: r });
        // });

        window.Chat.socket.on('system:new-room', function (room) {
          console.log(room);
          store.commit('newRoom', room);
        });

        window.Chat.socket.on('system:update-room', function (room) {
          console.log('Room is being updated!', room);
          store.commit('updateRoom', room);
        });

        window.Chat.socket.on('system:change-nickname', function (nickname) {
          store.commit('changeNickname', nickname);
        });

        window.Chat.socket.on('system:room-deleted', function (room_id) {
          console.log('Deleting room');
          store.commit('removeRoom', room_id);
        });
      }
    },
  }).$mount('#vue-app');
}
