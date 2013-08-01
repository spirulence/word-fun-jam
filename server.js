var http = require("http");

var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

var words = fs.readFileSync("brit-a-z.txt", {encoding:"utf-8"})
words = words.replace("'", "").replace("\r", "").split("\n")

var games = {}
	
function validName(name){
    return /\w+/.test(name)
}

app.listen(8765);

function handler (req, res) {
  fs.readFile(__dirname + req['url'],
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading');
    }

    res.writeHead(200);
    res.end(data);
  });
}



io.sockets.on('connection', function (socket) {
  socket.on('chatmessage', function (data) {
        //data.clientid = this.id;
        //io.sockets.emit('chatmessage', data);
        socket.broadcast.emit('chatmessage', data);
  });
});
