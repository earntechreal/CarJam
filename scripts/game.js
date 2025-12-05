/* scripts/game.js */

// --- Global Variables ---
const BOARD_SIZE = 6;
let currentLevelData = null;
let cars = [];     // Array of car objects
let cellSize = 0;  // Calculated in pixels

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Calculate the grid size based on the screen
    calculateLayout();

    // 2. Load the level (default to 1 if not specified in URL)
    const params = new URLSearchParams(window.location.search);
    const levelNum = params.get('level') || 1;
    loadLevel(levelNum);

    // 3. Reset Button Listener
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
        resetBtn.onclick = () => {
            // Reload the current level data from the initial state
            if (currentLevelData) {
                cars = JSON.parse(JSON.stringify(currentLevelData.cars));
                renderBoard();
                playSound('slide'); // Feedback sound
            }
        };
    }

    // 4. Handle Window Resize
    window.addEventListener('resize', () => {
        calculateLayout();
        renderBoard(); // Re-render to adjust positions
    });
});

/**
 * Calculates the size of the board and cells to fit the mobile screen.
 */
function calculateLayout() {
    // Max width of 600px, otherwise use screen width minus padding
    const maxWidth = Math.min(window.innerWidth, 600) - 40; 
    
    // Calculate cell size (ensure it's a whole number)
    cellSize = Math.floor(maxWidth / BOARD_SIZE);
    
    // Apply size to the HTML board element
    const board = document.getElementById('board');
    if (board) {
        board.style.width = `${cellSize * BOARD_SIZE}px`;
        board.style.height = `${cellSize * BOARD_SIZE}px`;
    }
    
    // Update CSS variable for styling children
    document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
}

/**
 * Fetches the level JSON file and initializes the game state.
 * @param {number|string} levelNum 
 */
async function loadLevel(levelNum) {
    try {
        // Update UI Text
        const levelDisplay = document.getElementById('current-level-num');
        if (levelDisplay) levelDisplay.innerText = levelNum;

        // Fetch the JSON file (Requires a local server)
        const response = await fetch(`levels/level${levelNum}.json`);
        
        if (!response.ok) {
            throw new Error(`Level ${levelNum} file not found.`);
        }

        const data = await response.json();
        currentLevelData = data;

        // Deep copy cars so we can reset later without re-fetching
        cars = JSON.parse(JSON.stringify(data.cars));
        
        console.log(`Level ${levelNum} loaded successfully.`);
        renderBoard();
        
    } catch (e) {
        console.error("Game Load Error:", e);
        alert("Could not load level. Make sure you are running a Local Server (e.g., Live Server). Redirecting to Home.");
        window.location.href = 'main.html';
    }
}

/**
 * Renders the cars and exit gate onto the board.
 */
function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = ''; // Clear existing elements
    
    if (!currentLevelData) return;

    // --- 1. Render Exit Marker ---
    const exitMarker = document.createElement('div');
    exitMarker.style.position = 'absolute';
    exitMarker.style.right = '-20px'; // Stick out to the right
    exitMarker.style.top = `${currentLevelData.exitRow * cellSize}px`;
    exitMarker.style.height = `${cellSize}px`;
    exitMarker.style.width = '20px';
    exitMarker.style.background = 'repeating-linear-gradient(45deg, #ffffff, #ffffff 5px, #333 5px, #333 10px)';
    exitMarker.style.border = '2px solid #333';
    exitMarker.style.zIndex = '0'; // Below cars
    board.appendChild(exitMarker);

    // --- 2. Render Cars ---
    cars.forEach(car => {
        const el = document.createElement('div');
        el.className = 'car';
        el.id = car.id;
        el.style.backgroundColor = car.color;
        
        // Calculate Dimensions based on orientation
        const gap = 4; // Visual gap between blocks
        if (car.type === 'h') {
            el.style.width = `${(car.len * cellSize) - gap}px`;
            el.style.height = `${cellSize - gap}px`;
        } else {
            el.style.width = `${cellSize - gap}px`;
            el.style.height = `${(car.len * cellSize) - gap}px`;
        }

        // Add visual styling for "Hero" car
        if (car.isHero) {
            el.style.boxShadow = "0 0 10px rgba(255, 71, 87, 0.6)";
            el.style.zIndex = "10"; // Hero on top
        }

        // Set Initial Position
        setPosition(el, car.col, car.row);
        
        // Attach Touch/Drag Logic (defined in touch.js)
        if (typeof initTouch === 'function') {
            initTouch(el, car);
        } else {
            console.error("touch.js is not loaded!");
        }
        
        board.appendChild(el);
    });
}

/**
 * Updates the CSS position of a car element.
 */
function setPosition(element, col, row) {
    const gap = 2; // Half of the visual gap for centering
    element.style.left = `${(col * cellSize) + gap}px`;
    element.style.top = `${(row * cellSize) + gap}px`;
}

/**
 * Checked by touch.js after every move.
 * Determines if the Hero car has reached the exit.
 */
function checkWin(car) {
    // If it's the hero car and the column index allows it to touch the right edge
    if (car.isHero && car.col >= BOARD_SIZE - 2) {
        
        // Disable further interaction
        document.getElementById('board').style.pointerEvents = 'none';
        
        playSound('win');
        
        setTimeout(() => {
            // Redirect to Win Page with the current level ID
            window.location.href = `win.html?level=${currentLevelData.id}`;
        }, 1000); // 1 second delay to celebrate
    }
}