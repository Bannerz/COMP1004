//dom elements for setting up
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const colourPicker = document.getElementById("colourPicker");
const generateBtn = document.getElementById("generateBtn");
const canvas = document.getElementById("pixelCanvas");
const ctx = canvas.getContext("2d");

//canvas and grid settings
let gridWidth, gridHeight, cellSize;
let isDrawing = false; //track if mouse is meant to be drawing

//resize canvas
function resizeCanvas() {
  const container = document.querySelector(".drawCanv");
  const maxCanvasWidth = container.clientWidth * 0.9;
  const maxCanvasHeight = window.innerHeight * 0.7;

  cellSize = Math.min(
    Math.floor(maxCanvasWidth / gridWidth),
    Math.floor(maxCanvasHeight / gridHeight)
  );

  canvas.width = gridWidth * cellSize;
  canvas.height = gridHeight * cellSize;

  drawGrid();
}

//generate the new canvas on button click
generateBtn.addEventListener("click", () => {
  gridWidth = parseInt(widthInput.value);
  gridHeight = parseInt(heightInput.value);

  resizeCanvas();
});

//draw the grid with cells
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#ddd";

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

//fill a pixel
function fillPixel(x, y) {
  ctx.fillStyle = colourPicker.value;
  ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
}

//click and drag mechanics set up
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  drawPixelFromEvent(e);
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    drawPixelFromEvent(e);
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false; //stop drawing if mouse leaves canvas
});

//draw pixel based on mouse event
function drawPixelFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const x = Math.floor(mouseX / cellSize);
  const y = Math.floor(mouseY / cellSize);

  fillPixel(x, y);
}

//generate grid on load
window.addEventListener("load", () => {
  gridWidth = 16;
  gridHeight = 16;

  widthInput.value = gridWidth;
  heightInput.value = gridHeight;

  resizeCanvas();
});

//make grid resize when window is resized
window.addEventListener("resize", () => {
  if (gridWidth && gridHeight) resizeCanvas();
});

//keyboard shortcut to clear and regenerate the grid
document.addEventListener("keydown", (e) => {
  if (e.key === "c" || e.key === "C") { // Listen for "C" key
    clearCanvas();
    resizeCanvas(); // Redraw the grid
  }
});

//clear canvas
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
}
