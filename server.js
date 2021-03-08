process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

require('dotenv').config();

const express = require('express');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const eta = require('eta');
const path = require('path');
const lusca = require('lusca');
const basicAuth = require('express-basic-auth');
const errorHandler = require('errorhandler');
const ua = require('express-useragent');
const socketSession = require('express-socket.io-session');
const { customAlphabet } = require('nanoid');

const seo = require('./tools/seo');

app.use(ua.express());
app.use(require('cookie-parser')('thankyoujesus'));

// eslint-disable-next-line import/order
const cookieSession = require('cookie-session')({
  name: 'bubbl-chat-session',
  keys: ['key'],
  // Cookie Options
  cookie: {
    path: '/',
    maxAge: 1000 * 60 * 24, // 24 hours,
    httpOnly: true,
    secure: true,
    overwrite: false,
  },
  maxAge: 7 * 24 * 60 * 60 * 1000, // 24 hours x 7
});
const Dbloader = require('./tools/db');
const { shutdown } = require('./tools/persist-db');
const SocketServer = require('./classes/SocketServer');
const ChatServer = require('./classes/ChatServer');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieSession);

function setCache(req, res, next) {
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
}

/** ETA TEMPLATE ENGINE */
app.engine('eta', eta.renderFile);
app.set('view engine', 'eta');
app.set('views', path.join(__dirname, 'views')); // crucial! lol
eta.configure({ views: path.resolve('views'), useWith: true });

/** security */
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(lusca.nosniff());
// app.use(lusca.csrf());
app.disable('x-powered-by');

app.use(setCache);
app.use('/', express.static(`${__dirname}/www`));

app.use((req, res, next) => {
  if (req.session.bubbl_chat_user_id && req.session.bubbl_chat_signedin) {
    res.locals.bubbl_user = req.signedCookies['bubbl-user'];
    res.locals.user_id = req.session.bubbl_chat_user_id;
    res.locals.nickname = req.session.bubbl_chat_nickname;
    res.locals.loggedIn = true;
  }

  res.locals.env = process.env.NODE_ENV;
  res.locals.host = req.host;

  console.log('nicknaaaa', req.session.bubbl_chat_nickname);
  res.locals.env = process.env.NODE_ENV.trim();

  res.locals.route = {
    query: req.query,
    params: req.params,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
  };
  next(); // <-- important!
});

io.use(socketSession(cookieSession));

let db;
let Chat;

Dbloader()
  .then((d) => {
    db = d;
    Chat = new ChatServer(db);

    Chat.loadData().then(() => {
      // eslint-disable-next-line no-new
      new SocketServer(io, Chat);
    });

    process
      .on('SIGTERM', shutdown('SIGTERM', db))
      .on('SIGINT', shutdown('SIGINT', db))
      .on('uncaughtException', shutdown('uncaughtException', db));
  })
  .catch((err) => {
    console.error('Error loading database => ', err);
  });

app.get('/', (req, res) => {
  return res.render('index');
});

// TODO  add bADICE AUTH!
app.get(
  '/admin',
  basicAuth({
    users: {
      admin: 'iloveyou',
    },
    challenge: true,
  }),
  (req, res) => {
    return res.render('admin');
  }
);

app.get('/delete/users', async (req, res) => {
  await Chat.deleteAllUsers();
  return res.send('Users deleted succesfully!');
});

app.get('/api/users', async (req, res) => {
  const users = await Chat.getUsers('db');
  return res.status(200).json(users);
});

app.get('/api/rooms', async (req, res) => {
  const rooms = await Chat.getRooms('db');
  return res.status(200).json(rooms);
});

app.get('/delete/rooms', async (req, res) => {
  await Chat.deleteAllRooms();
  return res.send('Rooms deleted succesfully!');
});

app.get('/login', async (req, res) => {
  delete req.session.target;

  if (!req.query.user) {
    console.log('User not logged in correctly. Try again!');
    return res.redirect('/');
  }

  if (req.session.bubbl_chat_signedin && req.session.bubbl_chat_user_id) {
    return res.redirect('/app');
  }

  const bubbl_username = req.signedCookies['bubbl-user'];
  console.log('Bubbl username => ', bubbl_username);
  const current_user = await db.users.findOne({ username: bubbl_username });

  if (current_user) {
    // user already exists!
    req.session.bubbl_chat_signedin = true;
    req.session.bubbl_chat_user_id = current_user.id;
    req.session.bubbl_chat_nickname = current_user.nickname;

    Chat.addUser(current_user);

    return res.redirect('/app');
  }

  const _user_id = customAlphabet('1234567890abcdef', 6)();
  const nickname = `user-${_user_id}`;

  req.session.bubbl_chat_signedin = true;
  req.session.bubbl_chat_user_id = _user_id;
  req.session.bubbl_chat_nickname = nickname;

  // This is a new user o
  const u = Chat.addUser({
    id: _user_id,
    nickname,
    bubbl_username: req.query.user || req.signedCookies['bubbl-user'],
  });

  try {
    await db.users.insert(u);
  } catch (err) {
    console.error('Error saving user => ', err);
  }

  return res.redirect('/app');
});

function isAuth(req, res, next) {
  if (!req.session.bubbl_chat_signedin && !req.session.bubbl_chat_user_id) {
    return res.redirect('/?reason=not_logged_in');
  }

  return next();
}

app.get('/logout', (req, res) => {
  if (!req.query.user) {
    return res.send('User not logged out correctly!');
  }

  req.session = null;
  res.clearCookie('bubbl-chat-session', { path: '/' });

  // Here delete all the things you need to delete and inform all sockets...
  console.log('User logged out successfully! => ', req.query.user);

  return res.redirect('/');
});

app.get('/app#/room/:id', isAuth, async (req, res) => {
  const room = await Chat.getRoomDb(req.params.id);

  console.log(room);

  if (!room) return res.status(404).send('Room does not exist!');
  return res.render('app');
});

app.get('/app#/lobby', isAuth, (req, res) => {
  return res.render('app');
});

/** For redirecting to chat room */
app.get(
  '/app/room/:id',
  seo.redirectToVue('/app#/room/', [{ key: 'id' }]),
  async (req, res) => {
    // first fetch chatroom from db, then send page back...
    if (!req.params.id) return res.status(404).send('Room id not sent!');

    const room = await Chat.getRoomDb(req.params.id);

    if (!room)
      return res
        .status(404)
        .send('<html><head><title>Room does not exist!</title></head></html>');

    const title = `Chat in the ${room.name} room | BChat`;
    const meta = seo.generateMeta(
      title,
      `Join other AUN students chatting in ${room.name}`,
      null,
      req.baseUrl + req.path,
      null
    );

    return res.render('seo/index', { title, meta });
  }
);

app.get('/get/rooms/:id', async (req, res) => {
  if (!req.params.id) return res.status(404).send('Room id not sent!');

  const room = await Chat.getRoomDb(req.params.id);

  if (!room) return res.status(404).send('Room does not exist!');

  return res.status(200).send('Room found!');
});

app.get(
  '/app/lobby',
  seo.redirectToVue('/app#/lobby', [{ key: null }]),
  async (req, res) => {
    const title = `Find a chatroom in the BChat lobby`;
    const meta = seo.generateMeta(
      title,
      `Find a new chatroom now in the BChat lobby`,
      null,
      req.baseUrl + req.path,
      null
    );

    return res.render('seo/index', { title, meta });
  }
);

app.use('/app', (req, res, next) => {
  console.log('in app');
  return next();
});

app.get('/app', isAuth, (req, res) => {
  console.log('in app x2');
  return res.render('app');
});

app.patch('/change-nickname', isAuth, (req, res) => {
  if (req.body.new_nickname) {
    Chat.changeUserNickname(
      req.session.bubbl_chat_user_id,
      req.body.new_nickname
    );

    req.session.bubbl_chat_nickname = req.body.new_nickname;

    return res
      .status(200)
      .json({ success: true, nickname: req.body.new_nickname });
  }

  return res.status(404).send('Missing username!');
});

app.get('/eventor-158', (req, res) => {
  console.log(
    `${new Date().getHours()}:${new Date().getMinutes()} Event name`,
    req.query.event
  );
  return res.status(200).send('seen! thank you eventor!');
});

const port = process.env.PORT || 3100;

if (process.env.NODE_ENV.trim() === 'dev') {
  // only use in development
  app.use(errorHandler());
} else {
  // Render an actual error page here :/
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
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
