const User = require('./classes/User');
const ChatRoom = require('./classes/ChatRoom');
const ChatServer = require('./classes/ChatServer');
const SocketServer = require('./classes/SocketServer');

const express = require('express'),
  app = express(),
  server = require('http').Server(app),
  io = require('socket.io')(server),
  eta = require('eta'),
  path = require('path'),
  lusca = require('lusca'),
  errorHandler = require('errorhandler'),
  Datastore = require('nedb-promises'),
  socketSession = require('express-socket.io-session'),
  { nanoid } = require('nanoid');

const cookieSession = require('cookie-session')({
  name: 'bubbl-auth-session',
  keys: ['key'],
  // Cookie Options
  maxAge: 7 * 24 * 60 * 60 * 1000, // 24 hours x 7
});
app.use(require('cookie-parser')());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieSession);

var users = []; // map from user id -> user object
var rooms = []; // array of chat rooms (index is the)
var connections = [];
var chatHistory = {}; // map from roomId to array of messages
var privateMessages = {}; // map from privateRoomId to array of messages

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
// app.use(lusca.csrf());
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

const rooms_collection = Datastore.create({
  filename: path.resolve(
    `${path.dirname(require.main.filename)}/db/rooms-datafile.db`
  ),
  autoload: false,
}).on('load', (s) => {
  console.log('rooms collection loaded');
});

const db = {
  users: users_collection,
  rooms: rooms_collection,
};

app.use(setCache);
app.use('/', express.static(__dirname + '/www'));

app.use(function (req, res, next) {
  if (req.session.bubbl_chat_user_id && req.session.bubbl_chat_signedin) {
    res.locals.bubbl_user = req.session.user;
    res.locals.user_id = req.session.bubbl_chat_user_id;
    res.locals.nickname = req.session.nickname;
    res.locals.loggedIn = true;
  }
  console.log('nicknaaaa', req.session.nickname);
  res.locals.env = process.env.NODE_ENV;

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

io.use(socketSession(cookieSession));

const Chat = new ChatServer(db);

Chat.loadData().then(() => {
  new SocketServer(io, Chat);
});

app.get('/', (req, res) => {
  return res.render('index');
});

// TODO  add bADICE AUTH!
app.get('/admin', isBubblAuth, (req, res) => {
  return res.render('admin');
});

app.get('/delete/users', async (req, res) => {
  await Chat.deleteAllUsers();
  return res.send('Users deleted succesfully!');
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

  let id = req.session.bubbl_chat_user_id;
  let current_user = await db.users.findOne({ id });

  if (current_user) {
    // user already exists!
    req.session.bubbl_chat_signedin = true;
    req.session.bubbl_chat_user_id = cu.id;
    req.session.nickname = cu.nickname;

    Chat.addUser(cu);

    return res.redirect('/app');
  }

  // maybe generate random id for user

  let _user_id = nanoid(5);
  let nickname = `user-${_user_id}`;

  req.session.bubbl_chat_signedin = true;
  req.session.bubbl_chat_user_id = _user_id;
  req.session.nickname = nickname;

  // This is a new user o
  let u = Chat.addUser({
    id: _user_id,
    nickname,
    bubbl_username: req.query.user || req.session.bubbl_user,
  });

  try {
    await db.users.insert(u);
  } catch (err) {
    console.error('Error saving user => ', err);
  }

  return res.redirect('/app');
});

app.get('/logout', (req, res) => {
  if (!req.query.user) {
    return res.send('User not logged out correctly!');
  }

  // Here delete all the things you need to delete and inform all sockets...
  console.log('User logged out successfully! => ', req.query.user);

  return res.redirect('/');
});

app.get('/app', (req, res) => {
  return res.render('app');
});

app.patch('/change-nickname', (req, res) => {
  if (req.body.new_nickname) {
    Chat.changeUserNickname(
      req.session.bubbl_chat_user_id,
      req.body.new_nickname
    );

    req.session.nickname = req.body.new_nickname;

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
