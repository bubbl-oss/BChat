/**
 * Lobby-Component
 */
/* eslint-disable no-unused-vars */
if (document.getElementById('vue-app')) {
  var LobbyComponent = {
    template: '#lobby-component',
    data() {
      return {
        name: 'Lobby Component',
        newRoomName: '',
        nickname: '',
      };
    },
    methods: {
      createRoom: function () {
        window.Chat.socket.emit('user:new-room', this.newRoomName);
      },
      deleteRoom: function (id) {
        window.Chat.socket.emit('user:delete-room', id);
      },
      changeNickname: function () {
        self = this;

        window.request
          .patch('/change-nickname')
          .withCredentials()
          .send({ new_nickname: this.nickname }) // sends a JSON post body
          .set('X-API-Key', 'foobar')
          .set('accept', 'json')
          .end(function (err, res) {
            // Calling the end function will send the request

            if (!res.ok) {
              console.log(res);
              return;
            }

            if (res.body.success || res.ok) {
              // move to token step...
              console.log(res.text);
              window.Chat.socket.emit(
                'user:change-nickname',
                res.body.nickname
              );
              window.Chat.nickname = res.body.nickname;
              self.nickname = '';
              return;
            }
          });
      },
      share: function (room_id, room_name) {
        if (navigator.share) {
          navigator
            .share({
              title: `Hey! Join the ${room_name || 'Random'} Chatroom`,
              url:
                document.location.protocol +
                document.location.host +
                `/app/room/${room_id}`,
            })
            .then(() => {
              console.log('Thanks for sharing!');
            })
            .catch(console.error);
        } else {
          return null;
          // shareDialog.classList.add('is-open');
        }
      },
    },
    computed: {
      chatsLoaded: function () {
        return this.$store.getters.chatsLoaded;
      },
      rooms: function () {
        return this.$store.getters.rooms;
      },
      user: function () {
        return this.$store.getters.user;
      },
    },
    // Make this a mixin! Thank you Jesus
    watch: {
      chatsLoaded(newv, oldv) {
        console.log(newv, oldv);

        if (newv) {
          console.log('Chats loaded successfully!');
          window.Chat.setContext('lobby');
          // this.$store.commit('increment');
        }
      },
    },
    mounted() {
      console.log('Lobby Component Loaded!');
      if (window.Chat) {
        window.Chat.setContext('lobby');
      }
    },
  };
}
