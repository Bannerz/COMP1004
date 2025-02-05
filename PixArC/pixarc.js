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
const paintBtn = document.getElementById("paintBtn");
const eraseBtn = document.getElementById("eraseBtn");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const gridToggleBtn = document.getElementById("gridToggleBtn");
const currentTool = document.getElementById("currentTool");
const resetView = document.getElementById("resetView");
const alertText = document.getElementById("alertText");
const secondTextWidth = document.getElementById("secondTextWidth");
const secondTextHeight = document.getElementById("secondTextHeight");
const ctx = canvas.getContext("2d");

//colour picker with alpha set up
let currentColour = "#000000"; //default colour
let alphaValue = 1; //default alpha

//undo/redo arrays
let pathsry = []; //stores drawn paths
let points = [];  //current path points
let redoStack = []; //stores undone paths for redo

//colour storage for history
let colourArry = [];

//tools set up
let isPainting = true;  //paint mode is default
let isErasing = false;  //erase mode is off

//brush size set up
let brushSize = 1; //default brush size
const brushSizeSlider = document.getElementById("brushSize");
const brushSizeValue = document.getElementById("brushSizeValue");

//mouse and grid settings
let mouse = { x: 0, y: 0 };
let previous = { x: 0, y: 0 };
let gridWidth, gridHeight, cellSize;
let isDrawing = false;
let showGrid = true; //flag to control grid visibility

//tool functions listeners
paintBtn.addEventListener("click", () => {
  isPainting = true;
  isErasing = false;
  console.log("Paint mode activated");
  currentTool.innerHTML = "Current tool: paint"; //change button text
});

eraseBtn.addEventListener("click", () => {
  isPainting = false;
  isErasing = true;
  console.log("Erase mode activated");
  currentTool.innerHTML = "Current tool: eraser"; //change button text

});

//redraw the canvas (grid and paths)
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); //clear the canvas
  if (showGrid) {
    drawGrid(); //draw the grid if the flag is true
  }
  redrawPaths(); //redraw all saved paths
}

//function to toggle grid visibility
function toggleGrid() {
  showGrid = !showGrid; //toggle the grid visibility flag
  redrawCanvas(); //update the canvas immediately
}

gridToggleBtn.addEventListener("click", toggleGrid);

//update brush size when slider is adjusted
brushSizeSlider.addEventListener("input", (e) => {
  brushSize = parseInt(e.target.value, 10);
  brushSizeValue.textContent = brushSize;
});

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
  let originalWidth = parseInt(widthInput.value);
  let originalHeight = parseInt(heightInput.value);

  let inputWidth = originalWidth;
  let inputHeight = originalHeight;

  //ensure values are within the allowed range
  if (inputWidth < 1) {
    inputWidth = 1;
    secondTextWidth.innerHTML = "Canvas width resized to minimum.";
  }
  if (inputHeight < 1) {
    inputHeight = 1;
    secondTextHeight.innerHTML = "Canvas height resized to minimum.";
  }
  if (inputWidth > 500) {
    inputWidth = 500;
    secondTextWidth.innerHTML = "Canvas width resized to maximum.";
  }
  if (inputHeight > 500) {
    inputHeight = 500;
    secondTextHeight.innerHTML = "Canvas height resized to maximum.";
  }

  //update input fields to reflect the corrected values
  widthInput.value = inputWidth;
  heightInput.value = inputHeight;

  //show alert
  if (originalWidth !== inputWidth || originalHeight !== inputHeight) {
    console.warn("Canvas size must be between 1 and 500!");

    var alertWin = document.getElementById("alertWin");
    var alertForHide = document.getElementById("alertForHide");

    alertWin.classList.add("showAlert");
    alertForHide.style.display = "block";

    alertText.innerHTML = "Canvas size must be between 1 and 500.";

    //hide alert after 3 seconds
    setTimeout(() => {
      alertWin.classList.remove("showAlert");
      alertForHide.style.display = "none";
      secondTextWidth.innerHTML = ""; //reset alert second texts after alert ends
      secondTextHeight.innerHTML = "";
    }, 3000);
  }

  //set the grid dimensions
  gridWidth = inputWidth;
  gridHeight = inputHeight;

  //clear previous paths
  pathsry = [];
  redoStack = [];

  generateBtn.innerHTML = "Regenerate Canvas";

  resizeCanvas(); //call resize function
});

//draw the grid
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#ddd"; //colour of grid lines

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

//update the colour history
function updateColourHistory(newColour) {
  if (!colourArry.includes(newColour)) {
    colourArry.push(newColour);
    addColourToHistory(newColour);
  }
}

//fill a pixel
function fillPixel(x, y, colour) { //coords and colour
  //convert hex to rgb for use with alpha
  const r = parseInt(colour.slice(1, 3), 16); //extract first 2 hex chars and convert to decimal
  const g = parseInt(colour.slice(3, 5), 16); //extract next 2 hex chars and convert to decimal
  const b = parseInt(colour.slice(5, 7), 16); //extract last 2 hex chars and convert to decimal

  //set RGBA colour using current alphaValue
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alphaValue})`;
  ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
}

function getTransformedMousePos(e) {
  //position and dimensions relative to the viewport
  const rect = canvas.getBoundingClientRect();

  //calc the mouse position in canvas coords considering the pan and scale
  const mouseX = (e.clientX - rect.left - panX) / scale;
  const mouseY = (e.clientY - rect.top - panY) / scale;

  //return the transformed mouse position, rounding to the nearest grid cell
  // divinding by cell size allows us to get grid-based coordinates
  return { x: Math.floor(mouseX / cellSize), y: Math.floor(mouseY / cellSize) };
}



//draw pixel from mouse event
function drawPixelFromEvent(e, colour) {
  //get the mouse position relative to the canvas after transformations
  const { x, y } = getTransformedMousePos(e);

  //check if the mouse position is within the grid boundaries
  if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
    const radius = Math.floor(brushSize / 2); //define the brush radius based on brush size

    //loop through the brush area around the mouse position
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const px = x + dx; //calculate pixel position in x
        const py = y + dy; //calculate pixel position in y

        //ensure pixel is within grid boundaries
        if (px >= 0 && px < gridWidth && py >= 0 && py < gridHeight) {
          //check if the pixel falls within the circular brush area
          if (dx * dx + dy * dy <= radius * radius) {
            //if erasing, clear the pixel and update the points array
            if (isErasing) {
              ctx.clearRect(px * cellSize, py * cellSize, cellSize, cellSize);
              //optionally draw the grid lines if enabled
              if (showGrid) ctx.strokeRect(px * cellSize, py * cellSize, cellSize, cellSize);
              points.push({ x: px, y: py, type: "erase" });
            } else {
              //if painting, fill the pixel with the selected color and update points array
              fillPixel(px, py, colour);
              points.push({ x: px, y: py, type: "paint", colour });
            }
          }
        }
      }
    }
  }
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
    if (isErasing) {
      // Save eraser actions
      pathsry.push({ points: points, type: "erase" });
    } else if (isPainting) {
      // Save paint actions with alpha
      const currentColour = colourPicker.value;
      addColourToHistory(currentColour);

      pathsry.push({
        points: points,
        type: "paint",
        colour: currentColour,
        alpha: alphaValue,
      });
    }

    redoStack = []; //clear redo stack on new draw
    isDrawing = false;
  }
});

//stop drawing when mouse leaves the canvas
canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

//function to add a colour to the colour history
function addColourToHistory(colour) {
  if (!colourArry.includes(colour)) {
    colourArry.push(colour);

    //create a new colour history box
    const colourBox = document.createElement("div");
    colourBox.style.backgroundColor = colour;
    colourBox.classList.add("colour-box");
    colourBox.title = colour; //tooltip for the colour

    //allow selecting the colour from history
    colourBox.addEventListener("click", () => {
      colourPicker.value = colour;
    });

    //append to the history container
    colourHistoryContainer.appendChild(colourBox);
  }
}

//check if brushSizeValue exists
brushSizeSlider.addEventListener("input", (e) => {
  brushSize = parseInt(e.target.value, 10);
  if (brushSizeValue) {
    brushSizeValue.textContent = brushSize;
  } else {
    console.warn("Brush size value display is missing.");
  }
});

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
    if (path.type === "erase") {
      //handle eraser actions
      path.points.forEach((point) => {
        ctx.clearRect(point.x * cellSize, point.y * cellSize, cellSize, cellSize);

        if (showGrid) {
          //redraw the grid line for erased cell
          ctx.strokeStyle = "#ddd";
          ctx.strokeRect(point.x * cellSize, point.y * cellSize, cellSize, cellSize);
        }
      });
    } else if (path.type === "paint") {
      //handle painting actions
      ctx.globalAlpha = path.alpha; //set alpha value
      path.points.forEach((point) => {
        fillPixel(point.x, point.y, path.colour);
      });
      ctx.globalAlpha = 1; //reset alpha after drawing
    }
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
  ctx.globalAlpha = 1; //reset alpha to default
if (showGrid) drawGrid();
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

//update RGBA colour
function updateRGBAColour() {
  const r = parseInt(currentColour.slice(1, 3), 16);
  const g = parseInt(currentColour.slice(3, 5), 16);
  const b = parseInt(currentColour.slice(5, 7), 16);
  const rgba = `rgba(${r}, ${g}, ${b}, ${alphaValue})`;

  rgbaDisplay.textContent = rgba; //show RGBA value
  console.log("Current RGBA Colour:", rgba);
  colourPickerValue = rgba; //update global variable or use this for drawing
}

//listen for base colour changes
colourPicker.addEventListener("input", (e) => {
  currentColour = e.target.value;
  updateRGBAColour();
});

//listen for alpha slider changes
alphaSlider.addEventListener("input", (e) => {
  alphaValue = e.target.value;
  updateRGBAColour();
});

//download logic
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
  console.log("File downloaded");
  alert("File downloaded!");
});

//keyboard shortcuts
//clear
document.addEventListener("keydown", (e) => {
  if (e.key === "c" || e.key === "C") {
    clearCanvas();
    resizeCanvas();
  }
});

//undo
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    Undo();
  }
});

//redo
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    Redo();
  }
});

//help
document.addEventListener("keydown", (e) => {
  if (e.key === "h"|| e.key === "H") {
    toggleHelp();
  }
});

//hide show help menu
function toggleHelp() {
  console.log("help toggled");

  var helpDisp = document.getElementById("helpWin");
  var blockDisp = document.getElementById("forHide");

  helpDisp.classList.toggle('show');

  if (blockDisp.style.display === "none") {
    blockDisp.style.display = "block";

  } else {
    blockDisp.style.display = "none";
  }
}

//function to restore colour history on load
function restoreColourHistory() {
  colourHistoryContainer.innerHTML = ""; //clear existing history
  colourArry.forEach((colour) => {
    const colourBox = document.createElement("div");
    colourBox.style.backgroundColor = colour;
    colourBox.classList.add("colour-box");
    colourBox.title = colour;

    //allow selecting the colour from history
    colourBox.addEventListener("click", () => {
      colourPicker.value = colour;
      currentColour = colour;
    });

    //append to the history container
    colourHistoryContainer.appendChild(colourBox);
  });
}

//save the canvas state
saveBtn.addEventListener("click", () => {
  const state = {
    gridWidth,
    gridHeight,
    cellSize,
    pathsry,
    colourArry,
    currentColour,
    alphaValue,
    isPainting,
    isErasing,
    brushSize,
  };

  const stateJSON = JSON.stringify(state); //convert state to JSON format
  const blob = new Blob([stateJSON], { type: "application/json" }); //create the blob using stateJSON and define as JSON file
  const url = URL.createObjectURL(blob); //create the url for download

  //create virtual download link
  const a = document.createElement("a");
  a.href = url;
  a.download = `PixArc_${gridWidth}x${gridHeight}_Canvas_State_${Math.floor((Math.random() * 100000) + 1)}.json`; //random-ish file name
  a.click();

  URL.revokeObjectURL(url); //release memory and resources once done using it
  console.log("Canvas state saved:", state); //print to console
});

//load the canvas state
loadBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";

  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const state = JSON.parse(event.target.result);

          //restore the canvas state
          gridWidth = state.gridWidth;
          gridHeight = state.gridHeight;
          cellSize = state.cellSize;
          pathsry = state.pathsry;
          colourArry = state.colourArry || [];
          currentColour = state.currentColour;
          alphaValue = state.alphaValue;
          isPainting = state.isPainting;
          isErasing = state.isErasing;
          brushSize = state.brushSize;

          //update UI elements
          widthInput.value = gridWidth;
          heightInput.value = gridHeight;
          colourPicker.value = currentColour;
          alphaSlider.value = alphaValue;
          brushSizeSlider.value = brushSize;
          brushSizeValue.textContent = brushSize;

          //restore colour history
          restoreColourHistory();

          //redraw the canvas
          resizeCanvas();
          redrawPaths();

          console.log("Canvas state loaded:", state);
        } catch (err) {
          console.error("Failed to load canvas state:", err);
          alert("Failed to load canvas state. Ensure the file is valid.");
        }
      };
      reader.readAsText(file);
    }
  });

  input.click();
});

//zoom and pan
//variabels for zoom and pan feature
let scale = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX, startY;


//apply transformations
function redrawTransformed() {
  ctx.setTransform(scale, 0, 0, scale, panX, panY); //apply zoom & pan
  ctx.clearRect(-panX / scale, -panY / scale, canvas.width / scale, canvas.height / scale);

  //keep grid width thin
  ctx.lineWidth = Math.max(0.5, 1 / scale);


  redrawCanvas(); //redraw grid and drawings
}

//reset all zoom/pan variables and redrae the canvas
resetView.addEventListener("click", () => {
  panX = 0;
  panY = 0;
  scale = 1;
  redrawTransformed();
  console.log("reset button clicked");
});

//zoom functionality with mouse wheel
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const zoomFactor = 1.1;
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;
  const zoomIn = e.deltaY < 0;

  //new scale
  const newScale = zoomIn ? scale * zoomFactor : scale / zoomFactor;

  //stop over zooming
  if (newScale < 0.5 || newScale > 5) return;

  //keep zoom centered around mouse
  panX = mouseX - ((mouseX - panX) * newScale) / scale;
  panY = mouseY - ((mouseY - panY) * newScale) / scale;
  scale = newScale;

  redrawTransformed();
});

//shift key for panning activation
canvas.addEventListener("mousedown", (e) => {
  if (e.shiftKey) {
    isPanning = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    canvas.style.cursor = "grab"; //cursor to indicate panning
  }
});

//pan with the mouse
canvas.addEventListener("mousemove", (e) => {
  if (isPanning) {
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    redrawTransformed();
  }
});

//stop panning
canvas.addEventListener("mouseup", () => {
  isPanning = false;
  canvas.style.cursor = "default";
});

//stop panning if mouse leaves canvas
canvas.addEventListener("mouseleave", () => {
  isPanning = false;
  canvas.style.cursor = "default";
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
https://www.youtube.com/watch?v=qOoZXaVN5Kk
https://www.tutorialspoint.com/html5/canvas_states.htm
https://stackoverflow.com/questions/20507534/how-to-save-and-load-html5-canvas-to-from-localstorage
https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
https://harrisonmilbradt.com/articles/canvas-panning-and-zooming
https://stackoverflow.com/questions/38142308/canvas-drag-on-mouse-movement
https://plnkr.co/edit/j8QCxwDzXJZN2DKszKwm?preview
*/
