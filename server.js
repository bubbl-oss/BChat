const express = require("express"),
  app = express(),
  server = require("http").Server(app),
  io = require("socket.io")(server),
  users = [];
//specify the html we will use
let setCache = function (req, res, next) {
  // here you can define period in second, this one is 5 minutes
  const period = 60 * 5;

  // you only want to cache for GET requests
  if (req.method == "GET") {
    res.set("Cache-control", `public, max-age=${period}, must-revalidate`);
  } else {
    // for the other requests set strict no caching parameters
    res.set("Cache-control", `no-store`);
  }

  // remember to call next() to pass on the request
  next();
};

// now call the new middleware function in your app

app.use(setCache);
app.use("/", express.static(__dirname + "/www"));
//bind the server to the 80 port
//server.listen(3000);//for local test
//server.listen(process.env.OPENSHIFT_NODEJS_PORT || 3000);//publish to openshift
//console.log('server started on port'+process.env.PORT || 3000);
//handle the socket

const port = process.env.PORT || 3000;
io.on("connection", function (socket) {
  //new user login
  socket.on("login", function (nickname) {
    if (users.indexOf(nickname) > -1) {
      socket.emit("nickExisted");
    } else {
      //socket.userIndex = users.length;
      socket.nickname = nickname;
      users.push(nickname);
      socket.emit("loginSuccess", nickname);
      io.sockets.emit("system", nickname, users.length, "login");
    }
  });
  //user leaves
  socket.on("disconnect", function () {
    if (socket.nickname != null) {
      //users.splice(socket.userIndex, 1);
      users.splice(users.indexOf(socket.nickname), 1);
      socket.broadcast.emit("system", socket.nickname, users.length, "logout");
    }
  });
  //new message get
  socket.on("postMsg", function (msg, color) {
    socket.broadcast.emit("newMsg", socket.nickname, msg, color);
  });
  //new image get
  socket.on("img", function (imgData, color) {
    socket.broadcast.emit("newImg", socket.nickname, imgData, color);
  });
});

server.listen(port, () => {
  console.log("Server started on port %s", port);
}); //publish to heroku
