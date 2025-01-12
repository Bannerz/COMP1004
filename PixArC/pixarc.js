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
let showGrid = true; // Flag to control grid visibility


//tool functions listeners
paintBtn.addEventListener("click", () => {
  isPainting = true;
  isErasing = false;
  console.log("Paint mode activated");
});

eraseBtn.addEventListener("click", () => {
  isPainting = false;
  isErasing = true;
  console.log("Erase mode activated");
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

//update the colour history
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

  //set RGBA colour using current alphaValue
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alphaValue})`;
  ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
}

//draw pixel from mouse event
function drawPixelFromEvent(e, colour) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const centreX = Math.floor(mouseX / cellSize);
  const centreY = Math.floor(mouseY / cellSize);

  //calculate the range of cells to fill based on brush size
  const radius = Math.floor(brushSize / 2);
  for (let x = centreX - radius; x <= centreX + radius; x++) {
    for (let y = centreY - radius; y <= centreY + radius; y++) {
      //check if the cell is within bounds
      if (x >= 0 && x < canvas.width / cellSize && y >= 0 && y < canvas.height / cellSize) {
        const dx = x - centreX;
        const dy = y - centreY;
        if (dx * dx + dy * dy <= radius * radius) {
          //inside the circular brush area
          if (isErasing) {
            //clear the pixel to make it transparent
            ctx.clearRect(x * cellSize, y * cellSize, cellSize, cellSize);

            if (showGrid) {
              //redraw the grid line for erased cell
              ctx.strokeStyle = "#ddd";
              ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }

            //save eraser action to paths
            points.push({ x, y, type: "erase" });
          } else {
            //fill the pixel normally
            fillPixel(x, y, colour);
            points.push({ x, y, type: "paint", colour });
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

//function to save the canvas state
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

  const stateJSON = JSON.stringify(state);
  const blob = new Blob([stateJSON], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  //create download link
  const a = document.createElement("a");
  a.href = url;
  a.download = `PixArc_${gridWidth}x${gridHeight}_Canvas_State_${Math.floor((Math.random() * 100000) + 1)}.json`;
  a.click();

  URL.revokeObjectURL(url);
  console.log("Canvas state saved:", state);
});

//function to load the canvas state
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
