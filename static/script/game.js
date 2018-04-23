const cellSize = 30;
var rowsCount;
var field;

var sideEnum = {
    ZERO: 0,
    CROSS: 1
};
var side;

var gDrawingContext;
var gCanvasElement;

function Cell(row, column) {
    this.row = row;
    this.column = column;
}

function main() {
    userSetup();
    reprint();
}

function userSetup() {
    var mapSizeInput = document.getElementById("map-size");
    rowsCount = mapSizeInput.value;

    field = [rowsCount][rowsCount];

    if (document.getElementById("cross-side-radio").checked) {
        side = sideEnum.CROSS;
    } else if (document.getElementById("zero-side-radio").checked) {
        side = sideEnum.ZERO;
    }
}

function reprint() {
    var mapSize = rowsCount * cellSize;
    gCanvasElement = document.getElementById("map-canvas");
    gCanvasElement.addEventListener("click", canvasClick, false);
    gCanvasElement.width = mapSize;

    gCanvasElement.height = mapSize;

    gDrawingContext = gCanvasElement.getContext("2d");
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

}

function drawPiece(cell) {
    var column = cell.column;
    var row = cell.row;
    var x = (column * cellSize) + (cellSize/2);
    var y = (row * cellSize) + (cellSize/2);

    if (side === sideEnum.ZERO) {
        drawZero(x, y);
    } else if (side === sideEnum.CROSS) {
        drawCross(x, y);
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

function canvasClick(e) {
    var cell = getCursorPosition(e);

    drawPiece(cell);
    field[cell.row][cell.column] = side;
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
    var cell = new Cell(Math.floor(y/cellSize),
        Math.floor(x/cellSize));
    return cell;
}
