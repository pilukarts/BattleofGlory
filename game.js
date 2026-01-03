// Battle of Glory - Game Logic
// Minimum Viable Product (MVP) v1.0

// ============================================
// INICIALIZACIÓN DEL JUEGO / GAME INITIALIZATION
// ============================================

// Game state object
const gameState = {
    isPlaying: false,
    score: 0,
    wave: 1,
    power: 0,
    hp: 100,
    grid: [],
    selectedCell: null,
    comboCount: 0
};

// SVG definitions for helmets (Cadets)
const cadets = {
    inferno: {
        name: 'Inferno',
        color: '#ff4444',
        gradient: 'inferno-grad',
        symbol: '🔥'
    },
    glacier: {
        name: 'Glacier',
        color: '#4488ff',
        gradient: 'glacier-grad',
        symbol: '❄️'
    },
    viper: {
        name: 'Viper',
        color: '#44ff44',
        gradient: 'viper-grad',
        symbol: '🐍'
    },
    celestial: {
        name: 'Celestial',
        color: '#ffaa00',
        gradient: 'celestial-grad',
        symbol: '⭐'
    }
};

// ============================================
// FUNCIONES DEL JUEGO / GAME FUNCTIONS
// ============================================

// Initialize the game board
function initGame() {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = '';
    gameState.grid = [];
    gameState.score = 0;
    gameState.wave = 1;
    gameState.power = 0;
    gameState.hp = 100;
    gameState.selectedCell = null;
    gameState.comboCount = 0;
    gameState.isPlaying = true;

    // Create 7x8 grid
    for (let row = 0; row < 8; row++) {
        gameState.grid[row] = [];
        for (let col = 0; col < 7; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.onclick = () => handleCellClick(row, col);
            
            grid.appendChild(cell);
            gameState.grid[row][col] = {
                element: cell,
                type: getRandomType(),
                isMatched: false
            };
            updateCellVisual(row, col);
        }
    }

    updateUI();
}

// Get random cadet type
function getRandomType() {
    const types = ['inferno', 'glacier', 'viper', 'celestial'];
    return types[Math.floor(Math.random() * types.length)];
}

// Update cell visual
function updateCellVisual(row, col) {
    const cellData = gameState.grid[row][col];
    const cell = cellData.element;
    
    // Clear previous content
    cell.innerHTML = '';
    
    // Add cadet/gem
    const cadet = cadets[cellData.type];
    cell.innerHTML = `
        <div class="cadet ${cellData.type}">
            <div class="cadet-glow"></div>
            <span class="cadet-symbol">${cadet.symbol}</span>
        </div>
    `;
    
    // Add matched animation if needed
    if (cellData.isMatched) {
        cell.querySelector('.cadet').classList.add('matched');
    }
}

// Handle cell click
function handleCellClick(row, col) {
    if (!gameState.isPlaying) return;

    const clickedCell = gameState.grid[row][col];

    if (gameState.selectedCell === null) {
        // First selection
        gameState.selectedCell = { row, col };
        clickedCell.element.classList.add('selected');
    } else {
        // Second selection - check if adjacent
        const first = gameState.selectedCell;
        const second = { row, col };
        
        clickedCell.element.classList.remove('selected');
        first.element.classList.remove('selected');
        
        if (isAdjacent(first, second)) {
            // Swap cells
            swapCells(first, second);
        }
        
        gameState.selectedCell = null;
    }
}

// Check if two cells are adjacent
function isAdjacent(cell1, cell2) {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// Swap two cells
function swapCells(cell1, cell2) {
    const type1 = gameState.grid[cell1.row][cell1.col].type;
    const type2 = gameState.grid[cell2.row][cell2.col].type;
    
    gameState.grid[cell1.row][cell1.col].type = type2;
    gameState.grid[cell2.row][cell2.col].type = type1;
    
    updateCellVisual(cell1.row, cell1.col);
    updateCellVisual(cell2.row, cell2.col);
    
    // Check for matches after swap
    setTimeout(() => {
        checkMatches();
    }, 200);
}

// Check for matches
function checkMatches() {
    let matches = [];
    
    // Check horizontal matches
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 5; col++) {
            const type = gameState.grid[row][col].type;
            if (type === gameState.grid[row][col + 1].type &&
                type === gameState.grid[row][col + 2].type) {
                matches.push({ row, col });
                matches.push({ row, col: col + 1 });
                matches.push({ row, col: col + 2 });
            }
        }
    }
    
    // Check vertical matches
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const type = gameState.grid[row][col].type;
            if (type === gameState.grid[row + 1][col].type &&
                type === gameState.grid[row + 2][col].type) {
                matches.push({ row, col });
                matches.push({ row: row + 1, col });
                matches.push({ row: row + 2, col });
            }
        }
    }
    
    if (matches.length > 0) {
        processMatches(matches);
    }
}

// Process matches and score
function processMatches(matches) {
    gameState.comboCount++;
    
    // Calculate score
    const basePoints = 10;
    const comboBonus = gameState.comboCount * 5;
    const points = matches.length * (basePoints + comboBonus);
    gameState.score += points;
    gameState.power = Math.min(100, gameState.power + matches.length * 2);
    
    // Mark cells as matched
    matches.forEach(pos => {
        gameState.grid[pos.row][pos.col].isMatched = true;
    });
    
    // Animate collection
    matches.forEach(pos => {
        const cell = gameState.grid[pos.row][pos.col].element;
        cell.classList.add('collecting');
    });
    
    // Remove matched and refill
    setTimeout(() => {
        matches.forEach(pos => {
            gameState.grid[pos.row][pos.col].type = getRandomType();
            gameState.grid[pos.row][pos.col].isMatched = false;
            updateCellVisual(pos.row, pos.col);
        });
        gameState.comboCount = 0;
        updateUI();
    }, 300);
}

// Update UI elements
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('wave').textContent = gameState.wave;
    document.getElementById('power').textContent = gameState.power + '%';
    document.getElementById('hp').textContent = gameState.hp;
}

// Start game
function startGame() {
    initGame();
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
}

// Show game over
function showGameOver() {
    gameState.isPlaying = false;
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('game-over-screen').style.display = 'flex';
}

// Restart game
function restartGame() {
    startGame();
}

// ============================================
// EVENTOS / EVENTS
// ============================================

// Start button click
document.getElementById('start-btn')?.addEventListener('click', startGame);
document.getElementById('restart-btn')?.addEventListener('click', restartGame);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !gameState.isPlaying) {
        startGame();
    }
    if (e.key === 'r' || e.key === 'R') {
        restartGame();
    }
});

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    console.log('Battle of Glory loaded successfully!');
});
