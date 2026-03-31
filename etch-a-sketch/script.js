document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const startBtn = document.getElementById('start-btn');
    const randomBtn = document.getElementById('random-btn');
    const darkenBtn = document.getElementById('darken-btn');
    const resetBtn = document.getElementById('reset-btn');
    const gridSizeInput = document.getElementById('grid-size');
    let gridSize = 16;
    let isDrawing = false;
    let isRandomMode = false;
    let isDarkenMode = false;

    // Function to generate random color
    function getRandomColor() {
        const letters = '0123456789ABCDEF'; // Hexadecimal characters for RGB values
        let color = '#'; // Start with a # symbol
        for (let i = 0; i < 6; i++) { // Generate 6 hexadecimal characters for RGB values  
            color += letters[Math.floor(Math.random() * 16)]; // Randomly select a hexadecimal character
        }
        return color; // Return the generated color
    }

    // Function to create the grid
    function createGrid(size) {
        grid.innerHTML = ''; // Clear the grid
        gridSize = size; // Set the grid size
        grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`; // Set the number of columns
        grid.style.gridTemplateRows = `repeat(${size}, 1fr)`; // Set the number of rows

        for (let i = 0; i < size * size; i++) { // Create a square for each cell in the grid
            const square = document.createElement('div'); // Create a new square
            square.classList.add('grid-square'); // Add the grid-square class to the square
            grid.appendChild(square); // Add the square to the grid
        }
    }

    // Initial grid creation
    createGrid(gridSize);

    // Handle grid size input changes
    gridSizeInput.addEventListener('change', (e) => {
        const newSize = parseInt(e.target.value) || 16; // Convert the input value to an integer, if it's not a number, set it to 16
        if (newSize > 0 && newSize <= 100) { // Check if the new grid size is valid
            createGrid(newSize); 
            isDrawing = false; 
            isRandomMode = false; 
            isDarkenMode = false; 
            startBtn.textContent = 'Start';
            randomBtn.textContent = 'Random'; 
            darkenBtn.textContent = 'Darken';
        } else {
            gridSizeInput.value = gridSize;
        }
    });

    // Toggle start/stop button
    startBtn.addEventListener('click', () => {
        // Check if any mode is currently active
        const anyModeActive = isDrawing || isRandomMode || isDarkenMode;
        
        // If any mode is active, turn them all OFF
        if (anyModeActive) {
            isDrawing = false;
            isRandomMode = false;
            isDarkenMode = false;
            startBtn.textContent = 'Start';
            randomBtn.textContent = 'Random';
            darkenBtn.textContent = 'Darken';
        } else {
            // If no mode is active, turn ON drawing mode
            isDrawing = true;
            startBtn.textContent = 'Stop';
        }
    });

    // Toggle random mode button
    randomBtn.addEventListener('click', () => {
        isRandomMode = !isRandomMode;
        isDrawing = false;
        isDarkenMode = false;
        randomBtn.textContent = isRandomMode ? 'Random: ON' : 'Random';
        startBtn.textContent = isRandomMode ? 'Stop' : 'Start';
        darkenBtn.textContent = 'Darken';
        if (!isRandomMode) { // If random mode is disabled, turn on normal drawing mode and set the button text to 'Stop'
            isDrawing = true;
            startBtn.textContent = 'Stop';
        }
    });

    // Toggle darken mode button
    darkenBtn.addEventListener('click', () => {
        isDarkenMode = !isDarkenMode;
        isDrawing = false;
        isRandomMode = false;
        darkenBtn.textContent = isDarkenMode ? 'Darken: ON' : 'Darken';
        startBtn.textContent = isDarkenMode ? 'Stop' : 'Start';
        randomBtn.textContent = 'Random';
        if (!isDarkenMode) { // If darken mode is disabled, turn on normal drawing mode and set the button text to 'Stop'
            isDrawing = true;
            startBtn.textContent = 'Stop';
        }
    });

    // Reset button functionality
    resetBtn.addEventListener('click', () => {
        const squares = document.querySelectorAll('.grid-square');
        squares.forEach(square => {
            square.style.backgroundColor = 'white';
        });
        isDrawing = false;
        isRandomMode = false;
        isDarkenMode = false;
        startBtn.textContent = 'Start';
        randomBtn.textContent = 'Random';
        darkenBtn.textContent = 'Darken';
    });

    // Drawing functionality - only works when a mode is active
    document.addEventListener('mouseover', (e) => {
        if (e.target.classList.contains('grid-square')) {
            if (isDrawing) {
                e.target.style.backgroundColor = 'black';
            } else if (isRandomMode) {
                e.target.style.backgroundColor = getRandomColor();
            } else if (isDarkenMode) {
                let darkness = parseInt(e.target.dataset.darkness) || 0;
                darkness += 1;
                e.target.dataset.darkness = darkness;
                
                // Darken by 10% per interaction, reaching full black at 10 interactions
                const maxDarkness = 10;
                if (darkness >= maxDarkness) {
                    e.target.style.backgroundColor = 'black';
                } else {
                    // Each interaction darkens by 10%, so 10% * darkness = darkness level
                    const darkness_percentage = 10 * darkness;
                    // Start from white (255, 255, 255) and darken
                    const gray = Math.round(255 * (1 - darkness_percentage / 100));
                    e.target.style.backgroundColor = `rgb(${gray}, ${gray}, ${gray})`;
                }
            }
        }
    });
});
