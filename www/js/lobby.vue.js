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
        window.Chat.socket.emit('user:change-nickname', this.nickname);
        window.Chat.nickname = this.nickname;
        this.nickname = '';
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
