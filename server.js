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
    var shouldMakeStep = secondSide == sideEnum.CROSS;
    io.sockets.connected[userId].emit('connected', size, secondSide, shouldMakeStep);
    io.sockets.connected[gameId].emit('connected', size, secondSide, shouldMakeStep);
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
