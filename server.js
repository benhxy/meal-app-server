var express = require("express");
var app = express();
var config = require("./config");

//mongoose and mongodb
var mongoose = require("mongoose");
mongoose.Promise = require('bluebird');
mongoose.connect(config.mongodb.devUrl, {useMongoClient: true});
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

//middlewares
var morgan = require('morgan');
var bodyParser = require('body-parser');
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
var path = require('path');

//temp routes for dev


//unprotected public routes
var authRoutes = require("./routes/authRoutes");
app.use("/api/auth/", authRoutes);


//protected routes
var userRoutes = require("./routes/userRoutes");
var mealRoutes = require("./routes/mealRoutes");
var utilRoutes = require("./routes/utilRoutes");
app.use("/api/users/", userRoutes);
app.use("/api/meals/", mealRoutes);
app.use("/api/utils/", utilRoutes);


//serve static front-end pages
app.get("*", (req,res)=>{res.sendFile(path.resolve(__dirname, '../meal-app-client', 'build', 'index.html'));
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
    console.log(err)
    //throw error;
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
      console.log(err);
      //throw error;
  }
});
server.on('listening', () =>  {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  //debug('Listening on ' + bind);
});
