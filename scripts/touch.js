function initTouch(element, carData) {
    let startX, startY, initialCol, initialRow;
    let isDragging = false;

    // Unified start handler
    const startHandler = (e) => {
        e.preventDefault(); // Stop scroll
        isDragging = true;
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;
        initialCol = carData.col;
        initialRow = carData.row;
        element.style.transition = 'none'; // Disable transition for direct 1:1 movement
        playSound('slide');
    };

    const moveHandler = (e) => {
        if (!isDragging) return;
        const touch = e.touches ? e.touches[0] : e;
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;

        // Calculate theoretical grid movement
        // 1. Determine pixels moved
        // 2. Clamp to axis
        let newX = initialCol * cellSize;
        let newY = initialRow * cellSize;

        if (carData.type === 'h') {
            newX += deltaX;
        } else {
            newY += deltaY;
        }

        // VISUAL ONLY: Limit drag based on collision logic (Simplified for UI feel)
        // For a robust game, you need to calculate min/max bounds here
        // This example allows dragging, then snaps back if invalid
        
        element.style.transform = `translate(${carData.type === 'h' ? deltaX : 0}px, ${carData.type === 'v' ? deltaY : 0}px)`;
    };

    const endHandler = (e) => {
        if (!isDragging) return;
        isDragging = false;
        element.style.transition = 'all 0.2s ease-out';
        element.style.transform = 'translate(0,0)'; // Reset transform, update Left/Top instead

        const touch = e.changedTouches ? e.changedTouches[0] : e;
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        
        // Calculate distinct moves (how many cells)
        const moveCellsX = Math.round(deltaX / cellSize);
        const moveCellsY = Math.round(deltaY / cellSize);

        let targetCol = initialCol;
        let targetRow = initialRow;

        if (carData.type === 'h') targetCol += moveCellsX;
        if (carData.type === 'v') targetRow += moveCellsY;

        // Validate Move
        if (isValidMove(carData, targetCol, targetRow)) {
            carData.col = targetCol;
            carData.row = targetRow;
            setPosition(element, carData.col, carData.row);
            checkWin(carData);
        } else {
            // Snap back
            setPosition(element, initialCol, initialRow);
        }
    };

    element.addEventListener('touchstart', startHandler);
    element.addEventListener('touchmove', moveHandler);
    element.addEventListener('touchend', endHandler);
    // Mouse fallback
    element.addEventListener('mousedown', startHandler);
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', endHandler);
}

function isValidMove(currentCar, targetCol, targetRow) {
    // 1. Boundary Checks
    if (targetCol < 0) return false;
    if (targetRow < 0) return false;
    if (currentCar.type === 'h' && targetCol + currentCar.len > BOARD_SIZE) {
        // Exception: Hero car entering exit
        if (currentCar.isHero && targetCol + currentCar.len > BOARD_SIZE) return true; 
        return false;
    }
    if (currentCar.type === 'v' && targetRow + currentCar.len > BOARD_SIZE) return false;

    // 2. Collision with other cars
    // We must check every cell between start and end to ensure no jumping over cars
    // For simplicity, this checks the final resting position. 
    // A robust version iterates steps: from initial to target.
    
    // Check if any *other* car occupies the cells required for the target position
    for (let c of cars) {
        if (c.id === currentCar.id) continue; // Skip self

        // Get occupied cells of car c
        let cCells = [];
        for(let i=0; i<c.len; i++) {
            cCells.push({
                x: c.type === 'h' ? c.col + i : c.col,
                y: c.type === 'v' ? c.row + i : c.row
            });
        }

        // Get target cells of currentCar
        let targetCells = [];
        for(let i=0; i<currentCar.len; i++) {
            targetCells.push({
                x: currentCar.type === 'h' ? targetCol + i : targetCol,
                y: currentCar.type === 'v' ? targetRow + i : targetRow
            });
        }

        // Check intersection
        for(let tCell of targetCells) {
            for(let cCell of cCells) {
                if(tCell.x === cCell.x && tCell.y === cCell.y) return false;
            }
        }
    }

    return true;
}

function checkWin(car) {
    if (car.isHero && car.col >= BOARD_SIZE - 2) {
        playSound('win');
        setTimeout(() => {
            window.location.href = 'win.html';
        }, 500);
    }
}