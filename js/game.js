function GameCtrl($scope, $location) {

    $scope.currentWord = '*******';

    ////////* game functions *////////

    $scope.yayWin = function(){
        el = $('<img class="happy anim" src="/img/smiley.svg">');
        $('#alerts').prepend(el);
        setTimeout(function(){
            el.remove();
        },1000);
    }

    $scope.booLose = function(){
        el = $('<img class="sad anim" src="/img/angry.svg">');
        $('#alerts').prepend(el);
        setTimeout(function(){
            el.remove();
        },1000);
    }

    $scope.clearFields = function(){
        $('input').val('');
        $scope.countDown = '';
    }

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

    socket.emit('init', { gameId: gameId, nick: nick });
  

    ////////* recieve messages *////////

    //load the new game
    socket.on('initResponse', function (nick, opponent) {
        console.log()
        $scope.playerReady = true;
        $scope.nick = nick;
        $scope.opponent = opponent;
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
    socket.on('results', function (win, opponentTime, yourTime) {
        
        //append total points, display smiley/rage
        $scope.opponentTime+= opponentTime;
        $scope.myTime+= yourTime;
        if( win ) {
            $scope.yayWin();
        } else {
            $scope.booLose();
        }
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