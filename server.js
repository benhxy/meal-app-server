//express
var express = require("express");
var app = express();

//config
var config = require("./config");

//mongoose and mongodb
var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');
mongoose.connect(config.mongodb.devUrl, {useMongoClient: true});
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

//middlewares
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//temp routes for dev
//app.get("/api/test/resetPassword", require("./testing/resetPasswordTest"));


//unprotected public routes
var authRoutes = require("./routes/authRoutes");
app.use("/api/auth/", authRoutes);


//protected routes
var userRoutes = require("./routes/userRoutes");
var mealRoutes = require("./routes/mealRoutes");
app.use("/api/users/", userRoutes);
app.use("/api/meals/", mealRoutes);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({message: "An error occurred", error: err});
});

module.exports = app;

//start server
app.set('port', config.serverPort);
var http = require('http');
var debug = require('debug')('app:server');
var server = http.createServer(app);
server.listen(config.serverPort);
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + config.serverPort
    : 'Port ' + config.serverPort;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});
server.on('listening', () =>  {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  //debug('Listening on ' + bind);
});
