var http = require("http");

var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , _ = require('lodash')
  , fs = require('fs')
  , url = require('url');

var words = fs.readFileSync("brit-a-z.txt");
words = words.toString('utf8');
words = words.replace("'", "").replace("\r", "").split("\n");

app.listen(8765);

var games = {};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
    
function Game(name){
    this.name = name;
    this.inProgress = false;
    this.players = [];
    this.nicks = [];
}
Game.prototype = {
    name: null,
    scores: {},
    rounds: 0,
    join: function(socket, gameId){
        if(this.nicks.indexOf(socket.nick) == -1 && this.nicks.length < 2){
            // this.players.forEach( function(player){
            //     socket.emit('setOpponent', player.nick);
            // });
            
            this.name = gameId,
            socket.game = this;
            this.scores[socket.nick] = {score:0};
            if(this.nicks.length==1){
                this.players[0].opponent = socket.nick;
                this.players.push(socket);
                this.players[1].opponent = this.players[0].nick;
            } else {
                this.players.push(socket);
            }
            this.nicks.push(socket.nick);
            
            if(this.nicks.length == 2){
                // this.players.forEach( function(player){
                //     player.emit('start');
                // });
                this.inProgress = true;
            }

            console.log('scores!!',this.scores);
            
            return true;
        }
        return false;
    },
    hasNick: function(nick){
        return this.nicks.indexOf(nick) != -1;
    },
    emit: function(socket, msg, data) {
        if(typeof data == undefined){ data = ''; }
        this.players.forEach( function(player){
            console.log(player.id);
            console.log(socket.id);
            if(socket.id!=player.id) {
                console.log('emitting keystroke');
                player.emit(msg, data);
            }
        });
    },
    start: function(){
        var gameId = this.name;
        this.rounds++;
        for(var i=5; i>=0; i--) {
            console.log('i', i);
            function timeIt(i) {
                setTimeout(function() { 
                    games[gameId].players.forEach( function(player){
                        player.emit('countDown', i);
                    });
                }, (5-i)*1000);
            }
            if(i>0){
                timeIt(i);
            } else {
                //start game
                console.log('start game');
                games[gameId].currentWord = getRandomWord();
                console.log(games[gameId].currentWord);
                setTimeout(function() { 
                    games[gameId].players.forEach( function(player){
                        player.emit('start');
                        player.emit('newWord', games[gameId].currentWord);
                    });
                }, (5-i)*1000);
            }
        }
    },
    newRound: function(winner){
        //send end of round messages, with updated player scores
        var gameId = this.name;
        this.rounds++;
        this.players.forEach( function(player){
            console.log('scores', this.scores);
            if(player.nick == winner){
                player.emit('win', {
                    you: games[gameId].scores[player.nick].score,
                    them: games[gameId].scores[player.opponent].score
                });
            } else {
                player.emit('lose', {
                    you: games[gameId].scores[player.nick].score,
                    them: games[gameId].scores[player.opponent].score
                });
            }
        });
        //get new word, and send it down
        games[gameId].currentWord = getRandomWord();
        setTimeout(function() { 
            games[gameId].players.forEach( function(player){
                player.emit('start');
                player.emit('newWord', games[gameId].currentWord);
            });
        }, 2000);
    }
};
    
function validGameId(gameId){
    return /\w+/.test(gameId);
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

function contentType(fn) {

    var a = fn.split(".");

    if( a.length === 1 || ( a[0] === "" && a.length === 2 ) ) {
        return "";
    }
    fn = a.pop().toLowerCase();

    switch(fn)
    {
    case 'html':
      return 'text/html';
      break;
    case 'htm':
      return 'text/html';
      break;
    case 'ico':
      return 'image/x-icon';
      break;
    case 'css':
      return 'text/css';
      break;
    case 'js':
      return 'text/javascript';
      break;
    case 'txt':
      return 'text/plain';
      break;
    case 'jpg':
      return 'image/jpeg';
      break;
    case 'jpeg':
      return 'image/jpeg';
      break;
    case 'png':
      return 'image/png';
      break;
    case 'gif':
      return 'image/gif';
      break;
    case 'svg':
      return 'image/svg+xml';
      break;
    default:
      return 'text/plain';
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
    }else if(req['url'] == "/getgames"){

        var data = [];
        _.forEach(games, function(game){ 
            var players=[];
            _.forEach(game.players, function(player){
                var obj = {nick: player.nick, score: game.scores[player.nick].score}
                players.push(obj);
            });
            data.push({
                name: game.name,
                rounds: game.rounds,
                players: players
            });
        });

        data = JSON.stringify(data);
        res.setHeader("Content-Type", "text/json");
        res.writeHead(200);
        res.end(data);
    
    } else { 
        if(req['url'] == "/"){
            req['url'] = "/index.html";
        }
        if(req['url'] == "/join"){
            req['url'] = "/join.html";
        }
        fs.readFile(__dirname + req['url'],
	        function (err, data) {
	            if (err) {
	                res.writeHead(500);
	                res.end("Error loading");
	            } else {
	            
		            res.setHeader("Content-Type", contentType(req['url']));
		            res.writeHead(200);
		            res.end(data);
		        }
        	}
    	);
    }
}

function getRandomWord() {
    var data = fs.readFileSync('brit-a-z.txt', {encoding: 'UTF8'});
    var lines = data.split('\n');
    return lines[Math.floor(Math.random()*lines.length)];
}

io.sockets.on('connection', function (socket) {
    socket.on('init', function (data){
        var gameId = data.gameId;
        var nick = data.nick;
        socket.nick = nick;
        
        if(!games.hasOwnProperty(gameId)){
            games[gameId] = new Game(gameId);
        }
        var game = games[gameId];
        
        if (game.join(socket, gameId)){
            console.log(nick+' joined game '+gameId);
            var opponent;
            if(game.players.length==2) { 
                console.log(game.players);
                game.players.forEach( function(player){
                    
                    if(player.id!=socket.id){
                        opponent = socket.nick;
                        player.emit('opponentJoined', opponent);
                        socket.emit('initResponse', nick, player.nick);
                        game.start();
                    }
                });
            } else {
                socket.emit('initResponse', nick, opponent);
            }
        }
    });

    socket.on('ask4word', function(){
        socket.emit('wordResponse', getRandomWord());
    });

    socket.on('keyStroke', function(userText){
        socket.game.emit(socket, 'update', userText.text);
    });

    socket.on('submitWord', function(word){
        if(socket.game.currentWord==word){
            socket.game.scores[socket.nick].score++;
            socket.game.newRound(socket.nick);
        }else{
            socket.emit(socket, 'wrong');
        }
    });

});