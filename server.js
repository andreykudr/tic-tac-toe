var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use('/', express.static('static'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/static/index.html');
});

app.get('/connect', function (req, res) {
   var gameId = req.query.gameId;
   games[gameId].secondUser = 1;
   res.sendFile(__dirname + '/static/index.html');
});

io.on('connection', function(socket){
    socket.on('start game', function (side, mapSize) {
        initNewGame(side, mapSize, socket.id)
    })

    socket.on('connect game', function (gameId) {
        connectToGame(gameId, socket.id);
    })

    socket.on('stepMade', function (cell, gameId) {
        var game = games[gameId];
        game.field.field[cell.row][cell.column] = cell;
        if (checkWin(sideEnum.ZERO, game.field)) {
            io.sockets.connected[gameId].emit('gameOver', sideEnum.ZERO);
            io.sockets.connected[game.secondUser].emit('gameOver', sideEnum.ZERO);
            game.field = new Field(game.field.size);
        } else if (checkWin(sideEnum.CROSS, game.field)) {
            io.sockets.connected[gameId].emit('gameOver', sideEnum.CROSS);
            io.sockets.connected[game.secondUser].emit('gameOver', sideEnum.CROSS);
            game.field = new Field(game.field.size);
        } else {
            var currentUser = socket.id;
            if (currentUser == gameId) {
                io.sockets.connected[game.secondUser].emit('yourStep', cell);
            } else {
                io.sockets.connected[gameId].emit('yourStep', cell);
            }
        }
    })

});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

var games = {};

function Game(mainPlayer, field) {
    this.mainPlayer = mainPlayer;
    this.field = field;
}

function Player(id, side) {
    this.id = id;
    this.side = side;
}

function Field(size) {
    this.size = size;
    this.field = initField();

    function initField() {
        var field = [size];
        for (var i = 0; i < size; ++i) {
            field[i] = [size];
            for (var j = 0; j < size; ++j) {
                field[i][j] = new Cell(i, j);
            }
        }
        return field;
    }
}

var sideEnum = {
    ZERO: "ZERO",
    CROSS: "CROSS",
    EMPTY: "EMPTY"
};

function initNewGame(side, mapSize, userId) {
    console.log('New game: ' + side + ' userId ' + userId);
    var mainPlayer = new Player(userId, side);
    var game = new Game(mainPlayer, new Field(mapSize));
    games[userId] = game;
    io.sockets.connected[userId].emit('gameCreated', userId);
}

function connectToGame(gameId, userId) {
    var game = games[gameId];
    game.secondUser = userId;
    var secondSide = getSecondPlayerSize(game);
    var size = game.field.size;
    /*cross always should make step first*/
    var secondPlayerShouldMakeStep = secondSide == sideEnum.CROSS;
    io.sockets.connected[userId].emit('connected', size, secondSide, secondPlayerShouldMakeStep);
    if (!secondPlayerShouldMakeStep) {
        io.sockets.connected[gameId].emit('yourStep', game.field.field[0][0]);
    }
}

function getSecondPlayerSize(game) {
    var secondSide;
    if (game.mainPlayer.side == sideEnum.CROSS) {
        secondSide = sideEnum.ZERO;
    } else {
        secondSide = sideEnum.CROSS;
    }
    return secondSide;
}

function Cell(row, column) {
    this.row = row;
    this.column = column;
    this.side = sideEnum.EMPTY;
}

function checkWin(checkingSide, field) {

    for (var i = 0; i < field.size; ++i) {
        var winHorizontal = true;
        var winVertical = true;
        var winDiagonal1 = true;
        var winDiagonal2 = true;
        for (var j = 0; j < field.size; ++j) {
            winHorizontal = winHorizontal & (field.field[i][j].side == checkingSide);
            winVertical = winVertical & (field.field[j][i].side == checkingSide);
            winDiagonal1 = winDiagonal1 & (field.field[j][j].side == checkingSide);
            winDiagonal2 = winDiagonal2 & (field.field[field.size - j - 1][j].side == checkingSide);
        }
        if (winVertical | winHorizontal | winDiagonal1 | winDiagonal2) {
            return true;
        }
    }
    return false;
}
