//dom elements for setting up
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const colourPicker = document.getElementById("colourPicker");
const generateBtn = document.getElementById("generateBtn");
const canvas = document.getElementById("pixelCanvas");
const undoButton = document.getElementById("undo");
const redoButton = document.getElementById("redo");
const colourHistoryContainer = document.getElementById("colourHistory");
const alphaSlider = document.getElementById("alphaSlider");
const rgbaDisplay = document.getElementById("rgbaDisplay");
const downloadBtn = document.getElementById("downloadBtn");
const ctx = canvas.getContext("2d");

//colour picker with alpha set up
let currentColor = "#000000"; //default color
let alphaValue = 1; //default alpha

//undo/redo arrays
let pathsry = []; //stores drawn paths
let points = [];  //current path points
let redoStack = []; //stores undone paths for redo

//colour storage for history
let colourArry = [];

//mouse and grid settings
let mouse = { x: 0, y: 0 };
let previous = { x: 0, y: 0 };
let gridWidth, gridHeight, cellSize;
let isDrawing = false;

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
  redrawPaths(); //redraw paths after resizing
}

//generate a new canvas grid
generateBtn.addEventListener("click", () => {
  gridWidth = parseInt(widthInput.value);
  gridHeight = parseInt(heightInput.value);
  pathsry = []; //clear previous paths
  redoStack = [];
  generateBtn.innerHTML = "Regenerate Canvas"; //change button text
  resizeCanvas();
});

//draw the grid
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#ddd";

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

//update the color history
function updateColourHistory(newColour) {
  if (!colourArry.includes(newColour)) {
    colourArry.push(newColour);
    addColourToHistory(newColour);
  }
}

//fill a pixel
function fillPixel(x, y, colour) {
  const r = parseInt(colour.slice(1, 3), 16);
  const g = parseInt(colour.slice(3, 5), 16);
  const b = parseInt(colour.slice(5, 7), 16);

  //set RGBA color using current alphaValue
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alphaValue})`;
  ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
}

//draw pixel from mouse event
function drawPixelFromEvent(e, colour) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const x = Math.floor(mouseX / cellSize);
  const y = Math.floor(mouseY / cellSize);

  fillPixel(x, y, colour); //pass the current color
}

//mouse events
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  points = [];
  mouse = oMousePos(canvas, e);
  points.push({ x: mouse.x, y: mouse.y });
  drawPixelFromEvent(e, colourPicker.value);
});

canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    mouse = oMousePos(canvas, e);
    points.push({ x: mouse.x, y: mouse.y });
    drawPixelFromEvent(e, colourPicker.value);
  }
});

//mouseup event listener
canvas.addEventListener("mouseup", () => {
  if (isDrawing) {
    const currentColour = colourPicker.value; //capture the current color
    pathsry.push({ points: points, colour: currentColour });
    redoStack = []; //clear redo stack on new draw
    isDrawing = false;

    //add the color to history after a successful draw
    addColourToHistory(currentColour);
  }
});

//stop drawing when mouse leaves the canvas
canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

//function to add a color to the color history
function addColourToHistory(colour) {
  //avoid adding duplicates
  if (!colourArry.includes(colour)) {
    colourArry.push(colour);

    //create a new color history box
    const colourBox = document.createElement("div");
    colourBox.style.backgroundColor = colour;
    colourBox.classList.add("colour-box");
    colourBox.title = colour; //tooltip for the color

    //allow selecting the color from history
    colourBox.addEventListener("click", () => {
      colourPicker.value = colour;
    });

    //append to the history container
    colourHistoryContainer.appendChild(colourBox);
  }
}

//undo function
function Undo() {
  if (pathsry.length > 0) {
    const lastPath = pathsry.pop();
    redoStack.push(lastPath);
    console.log(redoStack);
    clearCanvas();
    redrawPaths();
  }
}

//redo function
function Redo() {
  if (redoStack.length > 0) {
    const restoredPath = redoStack.pop();
    pathsry.push(restoredPath);
    clearCanvas();
    redrawPaths();
  }
}

//redraw all saved paths
function redrawPaths() {
  pathsry.forEach((path) => {
    path.points.forEach((point) => {
      const x = Math.floor(point.x / cellSize);
      const y = Math.floor(point.y / cellSize);
      fillPixel(x, y, path.colour); //use the saved color
    });
  });
}

//mouse position detector
function oMousePos(canvas, evt) {
  const ClientRect = canvas.getBoundingClientRect();
  return {
    x: Math.round(evt.clientX - ClientRect.left),
    y: Math.round(evt.clientY - ClientRect.top),
  };
}

//clear the canvas and redraw grid
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
}

//generate grid on load
window.addEventListener("load", () => {
  gridWidth = 16;
  gridHeight = 16;

  widthInput.value = gridWidth;
  heightInput.value = gridHeight;

  resizeCanvas();
});

//event listeners for undo/redo buttons
undoButton.addEventListener("click", Undo);
redoButton.addEventListener("click", Redo);

//resize grid when window resizes
window.addEventListener("resize", () => {
  if (gridWidth && gridHeight) resizeCanvas();
});


//update RGBA color
function updateRGBAColor() {
  const r = parseInt(currentColor.slice(1, 3), 16);
  const g = parseInt(currentColor.slice(3, 5), 16);
  const b = parseInt(currentColor.slice(5, 7), 16);
  const rgba = `rgba(${r}, ${g}, ${b}, ${alphaValue})`;

  rgbaDisplay.textContent = rgba; //show RGBA value
  console.log("Current RGBA Color:", rgba);
  colourPickerValue = rgba; //update global variable or use this for drawing
}

//listen for base color changes
colourPicker.addEventListener("input", (e) => {
  currentColor = e.target.value;
  updateRGBAColor();
});

//listen for alpha slider changes
alphaSlider.addEventListener("input", (e) => {
  alphaValue = e.target.value;
  updateRGBAColor();
});

downloadBtn.addEventListener("click", () => {
  //create an offscreen canvas at the user selected grid resolution
  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = gridWidth;
  offscreenCanvas.height = gridHeight;
  const offscreenCtx = offscreenCanvas.getContext("2d");

  //scale the current canvas content down to the grid resolution
  offscreenCtx.drawImage(canvas, 0, 0, gridWidth, gridHeight);

  //convert the offscreen canvas content to a PNG
  const imageData = offscreenCanvas.toDataURL("image/png");

  //create a download link
  const downloadLink = document.createElement("a");
  downloadLink.href = imageData;
  downloadLink.download = `PixArC_${gridWidth}x${gridHeight}_${Math.floor((Math.random() * 100000) + 1)}.png`; //add random number to file name
  downloadLink.click();
});


//keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "c" || e.key === "C") {
    clearCanvas();
    resizeCanvas();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    Undo();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    Redo();
  }
});

/*
credits and sources:
https://stackoverflow.com/questions/53960651/how-to-make-an-undo-function-in-canvas
https://www.codicode.com/art/undo_and_redo_to_the_html5_canvas.aspx
https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color
https://html.spec.whatwg.org/multipage/input.html#color-state-(type=color)
https://stackoverflow.com/questions/10671174/changing-button-text-onclick
https://www.w3schools.com/jsref/jsref_random.asp
https://www.geeksforgeeks.org/how-to-create-keyboard-shortcuts-in-javascript/
https://stackoverflow.com/questions/8126623/downloading-canvas-element-to-an-image
*/
