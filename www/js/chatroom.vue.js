/**
 * Chatroom-Component
 */
/* eslint-disable no-unused-vars */
if (document.getElementById('vue-app')) {
  var ChatroomComponent = {
    template: '#chatroom-component',
    data() {
      return {
        name: 'Chatroom Component',
        id: '',
      };
    },
    methods: {
      createRoom: function () {
        window.Chat.socket.emit('user:new-room', this.newRoomName);
      },
      deleteRoom: function () {
        window.Chat.socket.emit('user:delete-room', this.id);
      },
      leaveRoom: function () {
        window.Chat.socket.emit('user:leave-room', this.id);
        this.$router.push({ name: 'Lobby' });
      },
      joinRoom: function () {
        window.Chat.socket.emit('user:join-room', this.id);
      },
      start: function () {
        window.Chat.setContext('chatroom');
        window.Chat.setupChatroom();
        this.joinRoom();
      },
    },
    computed: {
      chatsLoaded: function () {
        return this.$store.getters.chatsLoaded;
      },
      room: function () {
        if (this.id) {
          return this.$store.getters.room(this.id);
        }
      },
    },
    watch: {
      chatsLoaded(newv, oldv) {
        console.log(newv, oldv);

        if (newv) {
          console.log('Chats loaded successfully!');
          this.start();
        }
      },
    },
    mounted() {
      console.log('Chatroom Component Loaded!');
      this.id = this.$route.params.id || '123-poop';

      if (window.Chat) {
        this.start();
      }
    },
  };
}
