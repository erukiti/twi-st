
/**
 * Module dependencies.
 */

var express = require('express')
  , socketio = require('socket.io')
  , routes = require('./routes')
;

app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.post('/', routes.index);
app.get('/tweet', routes.tweet);
app.get('/image', routes.image);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

global.io = socketio.listen(app);

//search("ラーメン");

process.on('uncaughtException', function(){console.debug()});
