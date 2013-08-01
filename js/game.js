function GameCtrl($scope) {
console.log($scope);

    ////////* game functions *////////

    $scope.yayWin = function(){
        $('#happy').removeClass('anim');
        $('#happy').addClass('anim');
    }

    $scope.booLose = function(){
        $('#sad').removeClass('anim');
        $('#sad').addClass('anim');
    }

    $scope.clearFields = function(){
        $('input').val('');
    }
    
    ////////* emit functions *////////

    $scope.init = function() {
        //gather game data, and tell server who you is
        socket.emit('init', { gameId: gameId, nick: nick });
    };

    $scope.keyStroke = function() {
        //gather game data, and tell server who you is
        socket.emit('keyStroke', { text: $scope.myText });
    };

    $scope.wordDone = function(time) {
        socket.emit('wordDone', { time: time });
    };

    ////////* recieve messages *////////

    //load the new game
    socket.on('initResponse', function (nick) {
        $scope.playerReady = true;
        $scope.nick = nick;
    });

    //receive any updates before game starts
    socket.on('setOpponent', function (opponent) {
        $scope.opponent = opponent;
    }); 

    //start game
    socket.on('start', function () {
        $scope.gameReady = true;
        $scope.clearFields();
    }); 

    //opponent typing
    socket.on('update', function (text) {
        $scope.opponentText = text;
    }); 

    //recieve a word to play on
    socket.on('newWord', function (word) {

        //start hand
        $scope.clearFields();
        
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

}