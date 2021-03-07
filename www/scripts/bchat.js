var BChat = function () {
  this.socket = null;
  this.nickname = null;
  this.context = 'lobby';
  this.id = null;
  this.user_id = null;
};
BChat.prototype = {
  init: function () {
    var self = this;
    this.socket = io.connect();
    this.socket.on('connect', function () {
      self.socket.emit('user:login');
    });
    this.socket.on('system:nickname-exists', function () {
      if (self.getContext('chatroom')) {
        document.getElementById('info').textContent =
          'Nickname is taken, choose another, please';
      }
    });
    this.socket.on('system:new-nickname', function (m) {
      if (self.getContext('chatroom')) {
        self._displayNewMsg(m.user, m.msg, m.color, m.time);
      }
    });
    this.socket.on('system:room', function (room) {
      if (self.getContext('chatroom')) {
        self._showOldMessages(room.messages);
      }
    });
    this.socket.on(
      'system:user-joined-room',
      function (user_id, room_id, count, m) {
        if (self.getContext('chatroom')) {
          console.log('user joined');
          console.log(m);
          self._displayNewMsg(m.user, m.msg, m.color, m.time);
          document.getElementById('status').textContent = `${count} online`;
        }
      }
    );
    this.socket.on(
      'system:joined-room',
      function (id, nickname, user_id, count, m, messages) {
        self.id = id;
        self.user_id = user_id;
        console.log(nickname);
        if (self.getContext('chatroom')) {
          // document.title = `Bubbl Chat | ${id} - ${nickname}`;

          self.nickname = nickname;
          document.getElementById('login-wrapper').style.display = 'none';
          document.getElementById('message-input').focus();
          document.getElementById('status').textContent = `${count} online`;
          self._showOldMessages(messages);
          self._displayNewMsg(m.user, m.msg, m.color, m.time);
        }
      }
    );
    this.socket.on('system:error', function (err) {
      if (document.getElementById('login-wrapper').style.display == 'none') {
        document.getElementById('status').textContent = '!fail to connect :(';
      } else {
        document.getElementById('info').textContent = '!fail to connect :(';
      }
    });
    this.socket.on('system:disconnect', function (type, m) {
      if (self.getContext('chatroom')) {
        self._displayNewMsg(m.user, m.msg, m.color, m.time);
      }
    });
    this.socket.on(
      'system:chatroom',
      function (nickname, userCount, type, time) {
        if (self.getContext('chatroom')) {
          var msg = nickname + (type == 'login' ? ' joined' : ' left');
          self._displayNewMsg('System ', msg, 'red', time);
          document.getElementById('status').textContent = `${userCount} online`;
        }
      }
    );
    this.socket.on(
      'chatroom:new-msg',
      function (user, msg, color, time, user_id) {
        if (self.getContext('chatroom')) {
          self._displayNewMsg(user, msg, color, time, user_id);
        }
      }
    );
    this.socket.on('chatroom:new-img', function (user, img, color) {
      if (self.getContext('chatroom')) {
        self._displayImage(user, img, color);
      }
    });
  },
  getContext: function (ctx) {
    return this.context == ctx;
  },
  setContext: function (context) {
    this.context = context;
  },
  setNickname: function (n) {
    this.nickname = n;
  },
  setupChatroom: function () {
    var self = this;
    document.getElementById('loginBtn').addEventListener(
      'click',
      function () {
        var nickname = document.getElementById('nickname-input').value;
        if (nickname.trim().length != 0) {
          self.socket.emit('user:login', nickname);
        } else {
          document.getElementById('nickname-input').focus();
        }
      },
      false
    );
    document.getElementById('nickname-input').addEventListener(
      'keyup',
      function (e) {
        if (e.key == 13) {
          var nickname = document.getElementById('nickname-input').value;
          if (nickname.trim().length != 0) {
            self.socket.emit('user:login', nickname);
          }
        }
      },
      false
    );
    document.getElementById('sendBtn').addEventListener(
      'click',
      function () {
        var messageInput = document.getElementById('message-input'),
          msg = messageInput.value,
          color = document.getElementById('color-style').value;
        messageInput.value = '';
        // messageInput.focus();
        if (msg.trim().length != 0) {
          self.socket.emit(
            'user:new-msg',
            msg,
            color,
            new Date(),
            self.id,
            self.user_id
          );
          self._displayNewMsg('me', msg, color, new Date(), self.user_id);
          return;
        }
      },
      false
    );
    document.getElementById('message-input').addEventListener(
      'keyup',
      function (e) {
        var messageInput = document.getElementById('message-input'),
          msg = messageInput.value,
          color = document.getElementById('color-style').value;
        if (e.keyCode == 13 && msg.trim().length != 0) {
          messageInput.value = '';
          self.socket.emit(
            'user:new-msg',
            msg,
            color,
            new Date(),
            self.id,
            self.user_id
          );
          self._displayNewMsg('me', msg, color, new Date(), self.user_id);
        }
      },
      false
    );
    // document.getElementById('clearBtn').addEventListener(
    //   'click',
    //   function () {
    //     self._clearScreen();
    //   },
    //   false
    // );
    // document.getElementById('send-image').addEventListener(
    //   'change',
    //   function () {
    //     if (this.files.length != 0) {
    //       var file = this.files[0],
    //         reader = new FileReader(),
    //         color = document.getElementById('color-style').value;
    //       if (!reader) {
    //         self._displayNewMsg(
    //           'System',
    //           "Your browser doesn't support fileReader",
    //           'red',
    //           new Date()
    //         );
    //         this.value = '';
    //         return;
    //       }
    //       reader.onload = function (e) {
    //         this.value = '';
    //         self.socket.emit('user:img', e.target.result, color);
    //         self._displayImage('me', e.target.result, color);
    //       };
    //       reader.readAsDataURL(file);
    //     }
    //   },
    //   false
    // );
    this._initialEmoji();
    // document.getElementById('emoji').addEventListener(
    //   'click',
    //   function (e) {
    //     var emojiWrapper = document.getElementById('emoji-wrapper');
    //     emojiWrapper.style.display = 'block';
    //     e.stopPropagation();
    //   },
    //   false
    // );
    // document.body.addEventListener('click', function (e) {
    //   if (self.getContext('chatroom')) {
    //     var emojiWrapper = document.getElementById('emoji-wrapper');
    //     if (e.target != emojiWrapper) {
    //       emojiWrapper.style.display = 'none';
    //     }
    //   }
    // });
    document.getElementById('emoji-wrapper').addEventListener(
      'click',
      function (e) {
        var target = e.target;
        if (target.nodeName.toLowerCase() == 'img') {
          var messageInput = document.getElementById('message-input');
          messageInput.focus();
          messageInput.value =
            messageInput.value + '[emoji:' + target.title + ']';
        }
      },
      false
    );
  },
  _initialEmoji: function () {
    var emojiContainer = document.getElementById('emoji-wrapper'),
      docFragment = document.createDocumentFragment();
    for (var i = 69; i > 0; i--) {
      var emojiItem = document.createElement('img');
      emojiItem.src = '../content/emoji/' + i + '.gif';
      emojiItem.title = i;
      docFragment.appendChild(emojiItem);
    }
    emojiContainer.appendChild(docFragment);
  },
  _displayNewMsg: function (user, msg, color, date, user_id) {
    var container = document.getElementById('chats'),
      user_el = document.createElement('p'),
      msgToDisplay = document.createElement('div'),
      //determine whether the msg contains emoji
      msg = this._showEmoji(msg);

    // msg.autoLink({ target: '_blank', rel: 'noopener noreferrer' });
    msgToDisplay.style.color = color || '#000';
    msgToDisplay.setAttribute('class', 'message card my-1');
    let m = `<p class='card-header message-text'>${msg}</p>`;
    let same_user = user_id == this.user_id;
    let d = moment(new Date(date));
    let display_date;
    if (!d.isSame(new Date(), 'day')) {
      display_date = d.format('DD/M/Y - kk:mm A');
    } else if (d.isSame(new Date(), 'minute')) {
      display_date = d.format('[just now]');
    } else {
      display_date = d.format('kk:mm A');
    }
    let user_tag = `<p class='text-muted font-monospace message-label' style='font-size:smaller;color:${
      color || '#000'
    } !important'>${
      same_user ? 'me' : user
    }<span class="timespan">(${display_date})</span></p>`;
    if (same_user) {
      msgToDisplay.setAttribute('class', 'message card my-1 ms-auto my-msg');
    }
    msgToDisplay.insertAdjacentHTML('afterbegin', user_tag);
    msgToDisplay.insertAdjacentHTML('afterbegin', m);
    // msgToDisplay.innerText = msgToDisplay.innerText.autoLink({
    //   target: '_blank',
    //   rel: 'noopener noreferrer',
    // });
    container.appendChild(msgToDisplay);
    container.scrollTop = container.scrollHeight;
  },
  _displayImage: function (user, imgData, color) {
    var container = document.getElementById('chats'),
      msgToDisplay = document.createElement('p'),
      date = new Date().toTimeString().substr(0, 8);
    msgToDisplay.style.color = color || '#000';
    msgToDisplay.innerHTML =
      user +
      '<span class="timespan">(' +
      date +
      '): </span> <br/>' +
      '<a href="' +
      imgData +
      '" target="_blank"><img src="' +
      imgData +
      '"/></a>';
    container.appendChild(msgToDisplay);
    container.scrollTop = container.scrollHeight;
  },
  _showEmoji: function (msg) {
    var match,
      result = msg,
      reg = /\[emoji:\d+\]/g,
      emojiIndex,
      totalEmojiNum = document.getElementById('emoji-wrapper').children.length;
    while ((match = reg.exec(msg))) {
      emojiIndex = match[0].slice(7, -1);
      if (emojiIndex > totalEmojiNum) {
        result = result.replace(match[0], '[X]');
      } else {
        result = result.replace(
          match[0],
          '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />'
        ); //todo:fix this in chrome it will cause a new request for the image
      }
    }
    return result;
  },
  _clearScreen: function () {
    document.getElementById('chats').innerHTML = '';
  },
  _showOldMessages: function (messages) {
    // this._clearScreen();
    messages.forEach((m) => {
      this._displayNewMsg(m.user, m.msg, m.color, m.time, m.user_id);
    });
  },
};
