function GameCtrl($scope, $location) {

    $scope.currentWord = '*******';
    $scope.myScore = 0;
    $scope.opponentScore = 0;

    ////////* game functions *////////

    $scope.submitWord = function(){
        console.log($scope.myText);
        if($scope.myText==$scope.currentWord){
            socket.emit('submitWord', $scope.myText);
            //$scope.yayWin();
        } else {
            //make a wiggle
            $('#myText').addClass('wiggle');
            setTimeout(function(){
                $('#myText').removeClass('wiggle');
                $scope.myText = '';
                $('#myText').val('');
            },300);
        }
    };

    $scope.playSound = function(filename){   
        document.getElementById("sound").innerHTML='<audio autoplay="autoplay"><source src="' + filename + '.mp3" type="audio/mpeg" /><source src="' + filename + '.ogg" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="' + filename +'.mp3" /></audio>';
    }

    $scope.yayWin = function(){
        el = $('<img class="happy anim" src="/img/smiley.svg">');
        $scope.playSound('/mp3/ding');
        $('#alerts').prepend(el);
        setTimeout(function(){
            el.remove();
        },1000);
    }

    $scope.booLose = function(){
        el = $('<img class="sad anim" src="/img/angry.svg">');
        $scope.playSound('/mp3/buzzer');
        $('#alerts').prepend(el);
        setTimeout(function(){
            el.remove();
        },1000);
    }

    $scope.clearFields = function(){
        $('input').val('');
        $scope.countDown = '';
    };

    $scope.winRound = function(){
        el = $('#currentWord');
        el.addClass('win');
        setTimeout(function(){
            el.removeClass('win')
        },500);
    };

    $scope.loseRound = function() {
        el = $('#currentWord');
        el.addClass('lose');
        setTimeout(function(){
            el.removeClass('lose')
        },500);
    };

    ////////* emit functions *////////

    // $scope.init = function() {
    //     //gather game data, and tell server who you is
    //     socket.emit('init', { gameId: gameId, nick: nick });
    // };

    $scope.$watch('myText', function(){
        //gather game data, and tell server who you is
        socket.emit('keyStroke', { text: $scope.myText });
    });

    $scope.wordDone = function(time) {
        socket.emit('wordDone', { time: time });
    };

    $scope.ask4word = function() {
        socket.emit('ask4word');
    };

    urlArr = $location.$$absUrl.split('/');
    var nick = urlArr[urlArr.length-1];
    var gameId = urlArr[urlArr.length-2];
    var params = null;
    var difficulty = null;
    var ai = false;
    var speed = null;
    var splits = nick.split("?");
    if(splits.length == 2){
        nick = splits[0];
        params = splits[1].split("&");
        if(params[0] && params[0]!='null') difficulty = params[0];
        if(params[1] && params[1]!='null') ai = params[1];
        if(params[2] && params[2]!='null') speed = params[2];
    }
    console.log($location.$$absUrl);
    console.log(params);
    socket.emit('init', { gameId: gameId, nick: nick, difficulty: difficulty, ai: ai, speed: speed });

    ////////* recieve messages *////////

    //load the new game
    socket.on('initResponse', function (nick, opponent) {
        $scope.playerReady = true;
        $scope.nick = nick;
        $scope.opponent = (opponent) ? opponent : 'opponent?';
        $scope.$apply();
    });

    //receive any updates before game starts
    // socket.on('setOpponent', function (opponent) {
    //     $scope.opponent = opponent;
    // }); 

    //start game
    socket.on('start', function () {
        console.log('game start');
        $scope.gameReady = true;
        $scope.clearFields();
    }); 

    //opponent typing
    socket.on('update', function (text) {
        $scope.opponentText = text;
        $scope.$apply();
    }); 

    //recieve a word to play on
    socket.on('newWord', function (word) {

        //start hand
        $scope.clearFields();
        $scope.currentWord = word;
        $scope.$apply();
    }); 

    //results of hand played, both clients
    // socket.on('results', function (win, opponentTime, yourTime) {
        
    //     //append total points, display smiley/rage
    //     $scope.opponentTime+= opponentTime;
    //     $scope.myTime+= yourTime;
    //     if( win ) {
    //         $scope.yayWin();
    //     } else {
    //         $scope.booLose();
    //     }
    // }); 

    socket.on('win', function(scores){
        $scope.opponentScore = scores.them;
        $scope.myScore = scores.you;
        $scope.yayWin();
    });

    socket.on('lose', function(scores){
        $scope.opponentScore = scores.them;
        $scope.myScore = scores.you;
        $scope.booLose();
    });

    //game over, announce winner
    socket.on('gameResults', function (data) {
        
        $scope.gameReady = false;
    });

    socket.on('opponentJoined', function(opponent) {
        console.log('opponent joined!', opponent);
        $scope.opponent = opponent;
    });

    socket.on('wordResponse', function (word) {
        $scope.currentWord = word;
        $scope.$apply();
    });

    socket.on('countDown', function (number) {
        $scope.countDown = number;
        $scope.$apply();
    });
}

function JoinCtrl($scope, $http) {

    $http({method: 'GET', url: '/getgames'}).
    success(function(data) {
        console.log(data);
        $scope.games = data;
    }).
    error(function(data, status, headers, config) {
        alert('oops couldn\'t get game list');
    });

    $scope.join = function(game){
        console.log(game);
        $('#joingame #gameid').val(game.name);
        $('#joingame').modal();
    };
}