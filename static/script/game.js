var socket;

const cellSize = 50;
var rowsCount;

var field;
var side;
var shouldMakeStepVar;
var gameId;

var gDrawingContext;
var gCanvasElement;

function Cell(row, column) {
    this.row = row;
    this.column = column;
    this.side = sideEnum.EMPTY;
}

var sideEnum = {
    ZERO: "ZERO",
    CROSS: "CROSS",
    EMPTY: "EMPTY"
};

function drawWait() {
    gDrawingContext.textAlign = "center";
    gDrawingContext.textBaseline = "middle";
    gDrawingContext.font = "50px verdana";
    gDrawingContext.fillText("wait", gCanvasElement.width / 2, gCanvasElement.height / 2);
}

function waitSecondPlayer(userId) {
    document.getElementById("connect-to-game-link").href = "connect?gameId=" + userId;
    document.getElementById("connect-to-game-link").textContent = userId;
    drawWait();
    gameId = userId;
}

function init() {
    socket = io();
    socket.on('gameCreated', function(userId) {
        waitSecondPlayer(userId)
    });
    socket.on('connected', function (size, sideP, shouldMakeStep) {
        side = sideP;
        shouldMakeStepVar = shouldMakeStep;
        rowsCount = size;
        initField();
        disableInput();
        reprint();
        if (!shouldMakeStepVar) {
            drawWait();
        }
    });
    socket.on('yourStep', function(cell) {
        field[cell.row][cell.column].side = cell.side;
        shouldMakeStepVar = true;
        reprint();
    });
    socket.on('gameOver', function (winSide) {
        endGame(winSide);
    })
    drawInit();
}

function start() {
    disableInput();
    userSetup();
    socket.emit('start game', side, rowsCount)
    reprint();
}

function connectToGame() {
    var gameCode = document.getElementById("gameCode").value;
    socket.emit('connect game', gameCode);
    gameId = gameCode;
}

function disableInput() {
    var inputs = document.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].disabled = true;
    }
}

function enableInput() {
    var inputs = document.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].disabled = false;
    }
}

function canvasClick(e) {
    var cell = getCursorPosition(e);
    if (shouldMakeStepVar) {
        makeStep(cell);
        drawWait();
    }
}


function endGame(side) {
    printWinner(side);
    enableInput();
}

function printWinner(side) {
    gCanvasElement.width = gCanvasElement.width;
    gDrawingContext.textAlign = "center";
    gDrawingContext.textBaseline = "middle";
    gDrawingContext.font = "20px verdana";
    gDrawingContext.fillText(side + " WINS", gCanvasElement.width / 2, gCanvasElement.height / 2);
}

function makeStep(cell) {
    if (field[cell.row][cell.column].side == sideEnum.EMPTY) {
        cell.side = side;
        drawPiece(cell);
        field[cell.row][cell.column] = cell;

        shouldMakeStepVar = false;
        socket.emit('stepMade', cell, gameId);
    }
}

function userSetup() {
    var mapSizeInput = document.getElementById("map-size");
    rowsCount = mapSizeInput.value;
    setupSide();
    initField();
}

function setupSide() {
    if (document.getElementById("cross-side-radio").checked) {
        side = sideEnum.CROSS;
    } else if (document.getElementById("zero-side-radio").checked) {
        side = sideEnum.ZERO;
    }
}

function initField() {
    field = [rowsCount];
    for (var i = 0; i < rowsCount; ++i) {
        field[i] = [rowsCount];
        for (var j = 0; j < rowsCount; ++j) {
            field[i][j] = new Cell(i, j);
        }
    }
}

function drawPiece(cell) {
    var x = (cell.column * cellSize) + (cellSize / 2);
    var y = (cell.row * cellSize) + (cellSize / 2);
    switch (cell.side) {
        case sideEnum.CROSS:
            drawCross(x, y);
            break;
        case sideEnum.ZERO:
            drawZero(x, y);
            break;
    }
}

function drawZero(x, y) {
    var radius = (cellSize / 2) - (cellSize / 10);
    gDrawingContext.beginPath();
    gDrawingContext.arc(x, y, radius, 0, Math.PI * 2, false);
    gDrawingContext.closePath();
    gDrawingContext.strokeStyle = "#000";
    gDrawingContext.stroke();
}

function drawCross(x, y) {
    gDrawingContext.textAlign = "center";
    gDrawingContext.textBaseline = "middle";
    gDrawingContext.font = cellSize + "px arial";
    gDrawingContext.fillText("x", x, y);
}

function reprint() {
    var mapSize = rowsCount * cellSize;
    gCanvasElement.width = mapSize;
    gCanvasElement.height = mapSize;

    gDrawingContext.beginPath();
    printVerticalLines();
    printHorizontalLines();
    gDrawingContext.strokeStyle = "#ccc";

    gDrawingContext.stroke();

    function printVerticalLines() {
        for (var i = 0, x = 0; i < rowsCount; ++i) {
            x += cellSize;
            gDrawingContext.moveTo(0.5 + x, 0);
            gDrawingContext.lineTo(0.5 + x, mapSize);
        }

    }

    function printHorizontalLines() {
        for (var i = 0, y = 0; i < rowsCount; ++i) {
            y += cellSize;
            gDrawingContext.moveTo(0, 0.5 + y);
            gDrawingContext.lineTo(mapSize, 0.5 + y);
        }
    }

    for (var i = 0; i < rowsCount; ++i) {
        for (var j = 0; j < rowsCount; ++j) {
            drawPiece(field[i][j]);
        }
    }
}

function getCursorPosition(e) {
    var x;
    var y;
    if (e.pageX != undefined && e.pageY != undefined) {
        x = e.pageX;
        y = e.pageY;
    }
    else {
        x = e.clientX + document.body.scrollLeft +
            document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop +
            document.documentElement.scrollTop;
    }
    x -= gCanvasElement.offsetLeft;
    y -= gCanvasElement.offsetTop;
    var cell = new Cell(Math.floor(y / cellSize),
        Math.floor(x / cellSize));
    return cell;
}

function drawInit() {
    gCanvasElement = document.getElementById("map-canvas");
    gCanvasElement.setAttribute("display", "block");
    gCanvasElement.addEventListener("click", canvasClick, false);
    gDrawingContext = gCanvasElement.getContext("2d");

    gDrawingContext.textAlign = "center";
    gDrawingContext.textBaseline = "middle";
    gDrawingContext.font = "50px verdana";
    gDrawingContext.fillText("X.  /  0.", gCanvasElement.width / 2, gCanvasElement.height / 2);
}




