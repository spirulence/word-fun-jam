//
// Don't give up, Ty!
//

//set up some server globals
var liveUsers = {};
var games = {};
var expiredGames = {};
var port = process.env.PORT || 8765;

var words = fs.readFileSync("brit-a-z.txt");
words = words.toString('utf8');
words = words.replace("'", "").replace("\r", "").split("\n");

var smallWords = fs.readFileSync("smallwords.txt");
smallWords = smallWords.toString('utf8');
smallWordsƒ = smallWords.replace("'", "").replace("\r", "").split("\n");

//http request handler
function handler (req, res) 

    //user login
    if(req['url'] == "/login"){

        //check username / pass are alphanumeric
        var rx = '???????';
        if(rx.check(username) || rx.check(password) ) {

            data = JSON.stringify({message:'username and password must be alphanumeric'});
            res.setHeader("Content-Type", "text/json");
            res.writeHead(403);
            res.end(data);
            return;

        } else {

            //read in user data
            var users = fs.readFileSync("users.json");

            //if the file is locked by another user, try unti its not
            var tries = 1;
            while (users=='locked' && tries <= 1000) {
                var users = fs.readFileSync("users.json");
                tries++;
            }

            //or fail
            if (users=='locked' && tries >= 1000) {
                data = JSON.stringify({message:'server error, could not read user database'});
                res.setHeader("Content-Type", "text/json");
                res.writeHead(500);
                res.end(data);
                return;
            }

            //if we can parse the JSON, make sure to lock the users data file so no one else can use it until its available
            if (users = JSON.parse(users)){

                //if user exists
                if (users[username]){

                    //and password is correct, log them in
                    if ( bcrypt.compareSync(users[username].password, password) ){


                        //if user is currently logged in, close their games, and reinitialize everything before logging them in
                        if (liveUsers[username]){

                            //do that logic here
                        }

                        //log them in, session-ish
                        liveUsers[username] = {status:'logged in'};

                        data = JSON.stringify({message:'user logged in'});
                        res.setHeader("Content-Type", "text/json");
                        res.writeHead(200);
                        res.end(data);
                        
                    } else {
                        //bad password
                        data = JSON.stringify({message:'bad username or password'});
                        res.setHeader("Content-Type", "text/json");
                        res.writeHead(401);
                        res.end(data);
                    }

                //user is new, add them
                } else {

                    //TODO: make this right!
                    fs.writeFileSync("users.json", 'locked');

                    //user doesn't exist, log them in, session-ish, save their info
                    liveUsers[username] = {status:'logged in'};
                    //TODO: do this right
                    users[username] = {password: bcrypt(password, 10)};

                    //'unlock' the user db
                    //TODO: make this right!
                    fs.writeFileSync("users.json", JSON.stringify(users));

                    data = JSON.stringify({message:'user logged in'});
                    res.setHeader("Content-Type", "text/json");
                    res.writeHead(200);
                    res.end(data);
                }

            //failed parsing of json data
            } else {

                data = JSON.stringify({message:'server error, could not read user database'});
                res.setHeader("Content-Type", "text/json");
                res.writeHead(401);
                res.end(data);
                return;
            }
        }

    //send a list of games that are on the server
    } else if(req['url'] == "/getgames"){

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
    
    //send static pages
    } else { 
        if(req['url'] == "/"){
            req['url'] = "/index.html";
        }
        if(req['url'] == "/join"){
            req['url'] = "/join.html";
        }
        if(req['url'] == "/game"){
            req['url'] = "/game.html";
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

//set up content types
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

//create server
var app = require('http').createServer(handler),
    io = require('socket.io').listen(app), 
    _ = require('lodash'), 
    fs = require('fs'), 
    url = require('url');

//websocket functions
io.sockets.on('connection', function (socket) {

    //set up socket after login
    socket.on('loggedIn', nick){
        socket.nick = nick;
    }

    //create game
    socket.on('createNewGame', function (gameId, gameData) {

        if(!gameId) socket.emit('error', 'bad game name');
        var difficulty = gameData['difficulty'] || null;
        var varyingLevels = gameData['varyingLevels'] || false;
        var maxPlayers = gameData['maxPlayers'] || 1;
        var ai = gameData['ai'] || false;

        //if they've chosen a computer player, ignore multiplayer settings if they snuck in
        if(ai){
            maxPlayers = 1;
            varyingLevels = false;
        }

        //if this game name isn't being used
        if(validGameId(gameId)){

            //create the game!
            console.log('sent init data', data);
            var gameId = data.gameId;
            var nick = data.nick;
            socket.nick = nick;
            var difficulty = null;
            var ai = data.ai;
            var speed = data.speed;
            if(data.difficulty!=null){
                var difficulty = data.difficulty;
            }
            
            if(!games.hasOwnProperty(gameId)){
                games[gameId] = new Game(gameId);
            }
            var game = games[gameId];
            
            if (game.join(socket, gameId, difficulty, ai, speed)){
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
                } else if(game.ai == true) { 
                    console.log(game.players);
                    socket.emit('initResponse', nick, 'computer');
                    game.start();

                } else {
                    socket.emit('initResponse', nick, opponent);
                }
            }            
        }
    }

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
            //socket.emit(socket, 'wrong');
        }
    });
}

//some important functions
function validGameId(gameId){
    if(/\w+/.test(gameId) && !games[gameId]){
        return true;
    } else {
        return false;
    }
}

function getRandomWord(gameDifficulty) {
    if(gameDifficulty=='easy'){
        return smallWords[Math.floor(Math.random()*smallWords.length)];
    } else if(gameDifficulty=='normal'){
        return words[Math.floor(Math.random()*words.length)];
    }
}
    
function Game(name){
    this.name = name;
    this.inProgress = false;
    this.players = [];
    this.nicks = [];
}

//our game object.  This guy does all the thinking.
Game.prototype = {
    name: null,
    scores: {},
    rounds: 0,
    difficulty: 'normal',
    ai: false,
    aiSpeed: 2,
    join: function(socket, gameId, difficulty, ai, speed){
        if(this.nicks.indexOf(socket.nick) == -1 && this.nicks.length < 2){
            // this.players.forEach( function(player){
            //     socket.emit('setOpponent', player.nick);
            // });
            
            this.difficulty = (difficulty!=null) ? difficulty : this.difficulty;
            this.name = gameId;
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

            //create artificial player
            if(ai) {
                this.ai = true;
                this.scores['computer'] = {score:0};
                this.players[0].opponent = 'computer';
                this.nicks.push('computer');
                if(speed) {
                    this.aiSpeed = speed;
                }
            }
            
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
                games[gameId].currentWord = getRandomWord(games[gameId].difficulty);
                console.log(games[gameId].currentWord);
                setTimeout(function() { 
                    games[gameId].players.forEach( function(player){
                        player.emit('start');
                        player.emit('newWord', games[gameId].currentWord);
                    });
                    if(games[gameId].ai==true){
                        setTimeout(function() { 
                            games[gameId].aiPlay();
                        }, 1000);
                    }
                }, (5-i)*1000);
            }
        }
    },
    aiPlay: function(){
        var gameId = this.name;
        var currentWord = games[gameId].currentWord;
        var letters = currentWord.split('');
        var word = '';
        var i;
        for(i=0; i<=letters.length; i++){

            //if we're done, instead send WIN
            if(i==letters.length){
                (function(index){
                    index++;
                    setTimeout(function(){ 
                        games[gameId].players.forEach( function(player){
                            
                            if(currentWord == games[gameId].currentWord) {
                                console.log('computer won');
                                games[gameId].scores['computer'].score++;
                                games[gameId].newRound(null);
                            } else {
                                //if we've lost(round is over) cancel
                                console.log('ai canceled win');
                            }
                    
                        });
                    }, (index*(games[gameId].aiSpeed*1000)));
                })(i);
            } else {
                word = word+letters[i];
                //play next letter
                (function(index, w){
                    index++;
                    setTimeout(function(){ 
                        games[gameId].players.forEach( function(player){
                            
                            if(currentWord == games[gameId].currentWord) {
                                games[gameId].emit({id:null}, 'update', w);
                                console.log('ai play', w);
                            } else {
                                //if we've lost(round is over) cancel
                                console.log('ai canceled play', w);
                            }
                        });
                    }, (index*(games[gameId].aiSpeed*1000)));
                })(i, word);
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
        games[gameId].currentWord = getRandomWord(games[gameId].difficulty);
        setTimeout(function() { 
            games[gameId].players.forEach( function(player){
                player.emit('start');
                player.emit('newWord', games[gameId].currentWord);
            });
            if(games[gameId].ai==true){
                games[gameId].aiPlay();
            }
        }, 2000);
    }
};
    

//start the server!
app.listen(port);

