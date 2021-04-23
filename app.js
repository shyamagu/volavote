var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session')
var logger = require('morgan');
var debug = require('debug')('volavote:server');
var http = require('http');

var app = express();
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res, next) {
  const fullurl = req.protocol + '://' + req.get('host') + req.originalUrl;
  res.render('index', { title: "volavote", url:fullurl});
});

app.get('/alt', function(req, res, next) {
  const title = req.query.title
  if(!global.box[title]){
    global.box[title] = {}
  }
  res.render('vote', { title: title});
});

app.get('/survey', function(req, res, next) {
  const title = req.query.title
  let num = req.query.num
  if(!num) num = 5
  const d1 = req.query.d1
  const d2 = req.query.d2
  const d3 = req.query.d3
  const d4 = req.query.d4
  const d5 = req.query.d5
  if(!global.box[title]){
    global.box[title] = {}
    global.box[title]["D1"]=d1
    global.box[title]["D2"]=d2
    global.box[title]["D3"]=d3
    global.box[title]["D4"]=d4
    global.box[title]["D5"]=d5
  }
  res.render('survey', { title: title, num:num, d1:d1, d2:d2, d3:d3, d4:d4, d5:d5});
});

app.get('/map', function(req, res, next) {
  const title = req.query.title
  let image = req.query.image
  let width = req.query.width
  if(isNaN(width)) width=500
  if(image==="japan"){
    image = "/images/japan.gif"
  }else if(image === "world"){
    image = "/images/world_img.png"
  }else if(image === "kanto"){
    image = "/images/kanto.gif"
  }
  if(!global.box[title]){
    global.box[title] = {}
  }
  global.box[title]["IMG"]=image
  global.box[title]["IMG_w"]=width
  res.render('map', { title: title, image: image, width: width});
});

global.box = {}

app.get('/box',function(req,res,next){

  let returnBoxes = []
  Object.keys(global.box).forEach(title=>{
    let returnBox = {}
    returnBox["title"]=title
    returnBox["YES"]=0
    returnBox["NO"] =0
    returnBox["S1"] =0
    returnBox["S2"] =0
    returnBox["S3"] =0
    returnBox["S4"] =0
    returnBox["S5"] =0 
    returnBox["D1"] =global.box[title]["D1"]
    returnBox["D2"] =global.box[title]["D2"]
    returnBox["D3"] =global.box[title]["D3"]
    returnBox["D4"] =global.box[title]["D4"]
    returnBox["D5"] =global.box[title]["D5"]
    returnBox["IMG"] =global.box[title]["IMG"]
    returnBox["IMG_w"] =global.box[title]["IMG_w"]
    returnBox["MAP"]=[]

    for(let key in global.box[title]){
      let value = global.box[title][key]
      if(["YES","NO","S1","S2","S3","S4","S5"].indexOf(value)>=0){
        returnBox[value] = (returnBox[value])? returnBox[value]+1 : 1;
      }else if(["IMG","IMG_w","D1","D2","D3","D4","D5"].indexOf(key)===-1){
        returnBox["MAP"].push(value)
      }
    }
    returnBoxes.push(returnBox)
  })

  res.render('box',{box:JSON.stringify(returnBoxes,null,4)})
})

app.post('/vote',function(req,res,next){
  vote = req.body
  if(vote.title){
    if(!global.box[vote.title]){
      global.box[vote.title] = {}
    }
    var judge = ""
    if(vote.type === "ALT"){
      if(vote.vote === "YES"){
        judge = "YES"
      }else{
        judge = "NO"
      }
    }else if(vote.type === "SURVEY"){
      if(vote.vote ==="S1"){
        judge = "S1"
      }else if(vote.vote==="S2"){
        judge = "S2"
      }else if(vote.vote==="S3"){
        judge = "S3"
      }else if(vote.vote==="S4"){
        judge = "S4"
      }else if(vote.vote==="S5"){
        judge = "S5"
      }
    }else if(vote.type === "MAP"){
      judge = vote.vote
    }
    global.box[vote.title][req.session.id] = judge

    let returnBox = {}
    returnBox["title"]=vote.title
    returnBox["YES"]=0
    returnBox["NO"] =0
    returnBox["S1"] =0
    returnBox["S2"] =0
    returnBox["S3"] =0
    returnBox["S4"] =0
    returnBox["S5"] =0
    returnBox["MAP"]=[]

    for(let key in global.box[vote.title]){
      let value = global.box[vote.title][key]
      if(["YES","NO","S1","S2","S3","S4","S5"].indexOf(value)>=0){
        returnBox[value] = (returnBox[value])? returnBox[value]+1 : 1;
      }else if(["IMG","IMG_w","D1","D2","D3","D4","D5"].indexOf(key)===-1){
        returnBox["MAP"].push(value)
      }
    }

    io.emit('voting',returnBox)
  }
  res.json("OK")
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

server = http.createServer(app);

/**
 * Socket.IO server
 */
var io = require('socket.io')(server)
io.on('connection',function(socket){
  let returnbox = {}
  socket.on('voting',function(title){
    if(!global.box[title]) return
    let returnBox = {}
    returnBox["title"]=title
    returnBox["YES"]=0
    returnBox["NO"] =0
    returnBox["S1"] =0
    returnBox["S2"] =0
    returnBox["S3"] =0
    returnBox["S4"] =0
    returnBox["S5"] =0
    returnBox["MAP"]=[]

    for(let key in global.box[title]){
      let value = global.box[title][key]
      if(["YES","NO","S1","S2","S3","S4","S5"].indexOf(value)>=0){
        returnBox[value] = (returnBox[value])? returnBox[value]+1 : 1;
      }else if(["IMG","IMG_w","D1","D2","D3","D4","D5"].indexOf(key)===-1){
        returnBox["MAP"].push(value)
      }
    }

    io.emit('voting',returnBox)
  })
})

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

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
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
