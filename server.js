const express = require('express'),
  app = express(),
  server = require('http').Server(app),
  io = require('socket.io')(server),
  eta = require('eta'),
  path = require('path'),
  lusca = require('lusca'),
  errorHandler = require('error-handler'),
  Datastore = require('nedb-promises'),
  { nanoid } = require('nanoid'),
  users = [];

const cookieSession = require('cookie-session');
app.use(require('cookie-parser')());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: 'bubbl-auth-session',
    keys: ['key'],
    // Cookie Options
    maxAge: 7 * 24 * 60 * 60 * 1000, // 24 hours x 7
  })
);

let messages = [];

let setCache = function (req, res, next) {
  // here you can define period in second, this one is 5 minutes
  const period = 60 * 5;

  // you only want to cache for GET requests
  if (req.method == 'GET') {
    res.set('Cache-control', `public, max-age=${period}, must-revalidate`);
  } else {
    // for the other requests set strict no caching parameters
    res.set('Cache-control', `no-store`);
  }
  next();
};

/** ETA TEMPLATE ENGINE */
app.engine('eta', eta.renderFile);
app.set('view engine', 'eta');
app.set('views', path.join(__dirname, 'views')); // crucial! lol
eta.configure({ views: path.resolve('views'), useWith: true });

/** security */
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(lusca.nosniff());
app.use(lusca.csrf());
app.disable('x-powered-by');
/** security */

const users_collection = Datastore.create({
  filename: path.resolve(
    `${path.dirname(require.main.filename)}/db/users-datafile.db`
  ),
  autoload: false,
}).on('load', (s) => {
  console.log('users collection loaded');
});

const db = {
  users: users_collection,
};

app.use(setCache);
app.use('/', express.static(__dirname + '/www'));

app.use(function (req, res, next) {
  // check if client sent cookie

  // console.log(bubblChatUserCookie);
  // console.log(bubblChatSessionUser);
  // console.log(req.cookies);

  // THIS IS AMAZING! IT WORKS! THANK YOU JESUS!
  // I CAN SHARE SESSIONS BETWEEN APPS! WOW!
  // single sign-on for the win!!!
  // console.log(req.session);

  if (req.session.isPopulated && req.session.bubbl_chat_signedin) {
    res.locals.bubbl_user = req.session.user;
    res.locals.user_id = req.session.bubbl_chat_user_id;
    res.locals.nickname = req.session.nickname;
    res.locals.loggedIn = true;
  }

  res.locals.route = {
    query: req.query,
    params: req.params,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
  };
  next(); // <-- important!
});

function isBubblAuth(req, res, next) {
  if (
    req.session &&
    req.session.bubbl_chat_signedin &&
    req.session.bubbl_chat_user_id
  ) {
    return next();
  }

  return res.redirect('/');
}

app.get('/', (req, res) => {
  return res.render('index');
});

app.get('/lobby', isBubblAuth, (req, res) => {
  return res.render('lobby');
});

app.get('/login', async (req, res) => {
  if (!req.query.user) {
    console.log('User not logged in correctly. Try again!');
    return res.redirect('/');
  }

  if (req.session.bubbl_chat_signedin && req.session.bubbl_chat_user_id) {
    return res.redirect('/lobby');
  }

  // maybe generate random id for user

  const id = nanoid(5);
  req.session.bubbl_chat_signedin = true;
  req.session.bubbl_chat_user_id = id;
  req.session.nickname = `user-${id}`;

  try {
    await db.users.insert({ username: req.query.user, id });
  } catch (err) {
    console.error('Error saving user => ', err);
  }

  delete req.session.target;

  return res.redirect('/lobby');
});

app.get('/logout', (req, res) => {
  if (!req.query.user) {
    return res.send('User not logged out correctly!');
  }

  // Here delete all the things you need to delete and inform all sockets...
  console.log('User logged out successfully! => ', req.query.user);

  return res.redirect('/');
});

app.get('/chat', (req, res) => {
  return res.render('chat');
});

app.get('/eventor-158', (req, res) => {
  console.log(
    `${new Date().getHours()}:${new Date().getMinutes()} Event name`,
    req.query.event
  );
  return res.status(200).send('seen! thank you eventor!');
});

const port = process.env.PORT || 3100;
io.on('connection', function (socket) {
  // Ideally, we should check for cookies first before allowing connection ?
  //new user login
  socket.on('login', function (nickname) {
    if (users.indexOf(nickname) > -1) {
      socket.emit('nickname-exists');
    } else {
      //socket.userIndex = users.length;
      socket.nickname = nickname;
      users.push(nickname);
      socket.emit('login-success', nickname);
      if (messages.length > 0) {
        socket.emit('old-messages', messages);
      }
      io.sockets.emit(
        'system',
        nickname,
        users.length,
        'login',
        new Date().getTime()
      );
    }
  });
  //user leaves
  socket.on('disconnect', function () {
    if (socket.nickname != null) {
      //users.splice(socket.userIndex, 1);
      users.splice(users.indexOf(socket.nickname), 1);
      socket.broadcast.emit(
        'system',
        socket.nickname,
        users.length,
        'logout',
        new Date().getTime()
      );
    }
  });
  //new message get
  socket.on('post-msg', function (msg, color, time) {
    socket.broadcast.emit('new-msg', socket.nickname, msg, color, time);
    messages.push({ user: socket.nickname, msg, color, time });
  });
  //new image get
  socket.on('img', function (imgData, color) {
    socket.broadcast.emit('new-img', socket.nickname, imgData, color);
  });
});

if (process.env.NODE_ENV.trim() === 'dev') {
  // only use in development
  app.use(errorHandler());
} else {
  // Render an actual error page here :/
  app.use((err, req, res) => {
    console.error(err);
    return res.render('error', { error: err.message });
  });
}

app.all('*', (req, res) => {
  res.locals.route_name = '404';
  res.render('error', { error: '404 - Page not found!' });
});

server.listen(port, () => {
  console.log('Server started on port %s', port);
});
