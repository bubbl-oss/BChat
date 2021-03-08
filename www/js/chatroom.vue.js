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
        console.log('Joining room');
      },
      share: function () {
        if (this.shareEnabled) {
          navigator
            .share({
              title: `Hey! Join the ${this.room.name || 'Random'} Chatroom`,
              url:
                document.location.protocol +
                '//' +
                document.location.host +
                `/app/room/${this.id}`,
            })
            .then(() => {
              console.log('Thanks for sharing!');
            })
            .catch(console.error);
        }
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
      shareEnabled: function () {
        return navigator.share != undefined;
      },
      copyLink: function () {
        return (
          document.location.protocol +
          '//' +
          document.location.host +
          `/app/room/${this.id}`
        );
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
      room(newv, oldv) {
        if (newv) {
          document.title = `Bubbl Chat | ${this.room.name}`;
        }
      },
    },
    mounted() {
      if (window.tinyxhr) {
        console.log('here!');
        self = this;
        window.tinyxhr(
          `/get/rooms/${this.$route.params.id}`,
          (err, res, xhr) => {
            if (err) {
              self.$router.push('/lobby');
              console.log('Room does not exist!');
              return;
            } else {
              console.log('Chatroom Component Loaded!');
              this.id = this.$route.params.id || '123-poop';

              // check if the room exists first!

              if (window.Chat) {
                console.log('Starting!');
                this.start();
              }
            }
          }
        );
      }

      if (window.bootstrap) {
        let copyBtn = document.getElementById('share-room-btn');
        let tooltop = new window.bootstrap.Tooltip(copyBtn);
      }

      if (!navigator.share && window.ClipboardJS) {
        let clippy = new ClipboardJS('#share-room-btn');

        clippy.on('success', function (e) {
          e.clearSelection();
          console.log(e);
        });

        clippy.on('error', function (e) {
          console.error('Error copying text');
        });
      }
    },
  };
}
