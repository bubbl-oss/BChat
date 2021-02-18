var BChat = function () {
  this.socket = null;
  this.currentUser = null;
};
BChat.prototype = {
  init: function () {
    var self = this;
    this.socket = io.connect();
    this.socket.on('connect', function () {
      let nickname = localStorage.getItem('bubbl-chat-username');

      if (nickname) {
        // if user exists, umm still send login request though.
        self.socket.emit('login', nickname);
      } else {
        // document.getElementById("info").textContent = "Enter a nickname";
        // document.getElementById("nickname-wrapper").style.display = "block";
        // document.getElementById("nickname-input").focus();
        self.socket.emit('get-nickname');
      }
    });
    this.socket.on('nickname-exists', function () {
      document.getElementById('info').textContent =
        'Nickname is taken, choose another, please';
    });
    this.socket.on('set-nickname', function (nickname) {
      localStorage.setItem('bubbl-chat-username', nickname);

      // document.getElementById("info").textContent =
      //   "Nickname is taken, choose another, please";
    });
    this.socket.on('old-messages', function (messages) {
      self._showOldMessages(messages);
    });
    this.socket.on('login-success', function (nickname) {
      document.title = `Bubbl Chat | ${nickname}`;
      // save in localstorage:
      localStorage.setItem('bubbl-chat-user', nickname);
      self.currentUser = nickname;
      document.getElementById('login-wrapper').style.display = 'none';
      document.getElementById('message-input').focus();
    });
    this.socket.on('error', function (err) {
      if (document.getElementById('login-wrapper').style.display == 'none') {
        document.getElementById('status').textContent = '!fail to connect :(';
      } else {
        document.getElementById('info').textContent = '!fail to connect :(';
      }
    });
    this.socket.on('system', function (nickname, userCount, type, time) {
      var msg = nickname + (type == 'login' ? ' joined' : ' left');
      self._displayNewMsg('System ', msg, 'red', time);
      document.getElementById('status').textContent = `${userCount} online`;
    });
    this.socket.on('new-msg', function (user, msg, color, time) {
      self._displayNewMsg(user, msg, color, time);
    });
    this.socket.on('new-img', function (user, img, color) {
      self._displayImage(user, img, color);
    });
    document.getElementById('loginBtn').addEventListener(
      'click',
      function () {
        var nickname = document.getElementById('nickname-input').value;
        if (nickname.trim().length != 0) {
          self.socket.emit('login', nickname);
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
            self.socket.emit('login', nickname);
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
          self.socket.emit('post-msg', msg, color, new Date().getTime());
          self._displayNewMsg('me', msg, color, new Date().getTime());
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
          self.socket.emit('post-msg', msg, color, new Date().getTime());
          self._displayNewMsg('me', msg, color, new Date().getTime());
        }
      },
      false
    );
    document.getElementById('clearBtn').addEventListener(
      'click',
      function () {
        self._clearScreen();
      },
      false
    );
    document.getElementById('send-image').addEventListener(
      'change',
      function () {
        if (this.files.length != 0) {
          var file = this.files[0],
            reader = new FileReader(),
            color = document.getElementById('color-style').value;
          if (!reader) {
            self._displayNewMsg(
              'System',
              "Your browser doesn't support fileReader",
              'red',
              new Date().getTime()
            );
            this.value = '';
            return;
          }
          reader.onload = function (e) {
            this.value = '';
            self.socket.emit('img', e.target.result, color);
            self._displayImage('me', e.target.result, color);
          };
          reader.readAsDataURL(file);
        }
      },
      false
    );
    this._initialEmoji();
    document.getElementById('emoji').addEventListener(
      'click',
      function (e) {
        var emojiWrapper = document.getElementById('emoji-wrapper');
        emojiWrapper.style.display = 'block';
        e.stopPropagation();
      },
      false
    );
    document.body.addEventListener('click', function (e) {
      var emojiWrapper = document.getElementById('emoji-wrapper');
      if (e.target != emojiWrapper) {
        emojiWrapper.style.display = 'none';
      }
    });
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
  _displayNewMsg: function (user, msg, color, time) {
    var container = document.getElementById('chats'),
      msgToDisplay = document.createElement('p'),
      date = new Date(time).toTimeString().substr(0, 8),
      //determine whether the msg contains emoji
      msg = this._showEmoji(msg);
    msg.autoLink({ target: '_blank', rel: 'noopener noreferrer' });
    msgToDisplay.style.color = color || '#000';
    let m = `${user}<span class="timespan">(${date}):</span> ${msg}`;
    if (user == 'me' || user == this.currentUser) {
      user = 'me';
      msgToDisplay.setAttribute('class', 'ms-auto my-msg');
      m = `${msg} <span class="timespan">:(${date})</span>${user}`;
    }
    msgToDisplay.innerHTML = m;
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
    this._clearScreen();
    messages.forEach((m) => {
      this._displayNewMsg(m.user, m.msg, m.color, m.time);
    });
  },
};
