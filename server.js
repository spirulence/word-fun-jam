var http = require("http");

var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , url = require('url')

var words = fs.readFileSync("brit-a-z.txt", {encoding:"utf-8"});
words = words.replace("'", "").replace("\r", "").split("\n");

app.listen(8765);

var games = {};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
    
function Game(name){
    this.name = name;
    this.inProgress = false;
    this.players = []
    this.nicks = []
}
Game.prototype = {
    name: null,
    join: function(socket){
        if(this.nicks.indexOf(socket.nick) == -1 && this.nicks.length < 2){
            this.players.forEach( function(player){
                socket.emit('setOpponent', player.nick);
            });
            
            socket.game = game;
            socket.score = 0;
            this.players.push(socket);
            this.nicks.push(socket.nick);
            
            if(this.nicks.length == 2){
                this.players.forEach( function(player){
                    player.emit('start');
                });
                this.inProgress = true;
            }
            
            return true;
        }
        return false;
    },
    hasNick: function(nick){
        return this.nicks.indexOf(nick) != -1;
    }
}
    
function validGameId(name){
    return /\w+/.test(name)
}

function nickAvailable(gameId, nick){
    if(games.hasOwnProperty(gameId)){
        if(games[gameId].hasNick(nick)){
            return false;
        }else{
            return true;
        }
    }else{
        return true;
    }
}
    
function handler (req, res) {
    if(/\/game\/.*/.test(req['url'])){
        var parsed = url.parse(req['url'].slice(5));
        var splits = parsed.path.split("/");
        if(splits.length == 3){
            var gameId = splits[1];
            var nick = splits[2];
            if(validGameId(gameId) && nickAvailable(gameId, nick)){
                fs.readFile(__dirname + "/game.html",
                function (err, data) {
                    if (err) {
                        res.writeHead(500);
                        res.end("Error loading");
                    }
                    res.writeHead(200);
                    res.end(data);
                });
            }else{
                res.writeHead(500);
                res.end("Bad game or nick");
            }
        }else{
            res.writeHead(500);
            res.end("Bad game url");
        }
    }else{
        if(req['url'] == "/"){
            req['url'] = "/index.html";
        }
        fs.readFile(__dirname + req['url'],
        function (err, data) {
            if (err) {
                res.writeHead(500);
                res.end("Error loading");
            }

            res.writeHead(200);
            res.end(data);
        });
    }
}


io.sockets.on('connection', function (socket) {
    socket.on('init', function (gameId, nick){
        socket.nick = nick;
        
        if(!games.hasOwnProperty(gameId)){
            games[gameId] = new Game(gameId);
        }
        var game = games[gameId];
        
        if (game.join(socket)){
            socket.emit('initResponse', {});
        }
    });
    
});
