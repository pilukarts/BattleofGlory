// Battle of Glory - Game Logic
// Minimum Viable Product (MVP) v1.0

// ============================================
// INICIALIZACIÓN DEL JUEGO
// ============================================

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

const cadets = {
    inferno: { name: 'Inferno', color: '#ff4444', symbol: '🔥' },
    glacier: { name: 'Glacier', color: '#4488ff', symbol: '❄️' },
    viper: { name: 'Viper', color: '#44ff44', symbol: '🐍' },
    celestial: { name: 'Celestial', color: '#ffaa00', symbol: '⭐' }
};

// ============================================
// FUNCIONES DEL JUEGO
// ============================================

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

    for (let row = 0; row < 8; row++) {
        gameState.grid[row] = [];
        for (let col = 0; col < 7; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', function() {
                handleCellClick(row, col);
            });
            
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

function getRandomType() {
    const types = ['inferno', 'glacier', 'viper', 'celestial'];
    return types[Math.floor(Math.random() * types.length)];
}

function updateCellVisual(row, col) {
    const cellData = gameState.grid[row][col];
    const cell = cellData.element;
    const cadet = cadets[cellData.type];
    
    cell.innerHTML = '<div class="cadet ' + cellData.type + '"><span class="cadet-symbol">' + cadet.symbol + '</span></div>';
    
    if (cellData.isMatched) {
        cell.querySelector('.cadet').classList.add('matched');
    }
}

function handleCellClick(row, col) {
    if (!gameState.isPlaying) return;

    const clickedCell = gameState.grid[row][col];

    if (gameState.selectedCell === null) {
        gameState.selectedCell = { row, col };
        clickedCell.element.classList.add('selected');
    } else {
        const first = gameState.selectedCell;
        clickedCell.element.classList.remove('selected');
        first.element.classList.remove('selected');
        
        if (isAdjacent(first, { row, col })) {
            swapCells(first, { row, col });
        }
        
        gameState.selectedCell = null;
    }
}

function isAdjacent(cell1, cell2) {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function swapCells(cell1, cell2) {
    const type1 = gameState.grid[cell1.row][cell1.col].type;
    const type2 = gameState.grid[cell2.row][cell2.col].type;
    
    gameState.grid[cell1.row][cell1.col].type = type2;
    gameState.grid[cell2.row][cell2.col].type = type1;
    
    updateCellVisual(cell1.row, cell1.col);
    updateCellVisual(cell2.row, cell2.col);
    
    setTimeout(function() {
        checkMatches();
    }, 200);
}

function checkMatches() {
    let matches = [];
    
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

function processMatches(matches) {
    gameState.comboCount++;
    
    const basePoints = 10;
    const comboBonus = gameState.comboCount * 5;
    const points = matches.length * (basePoints + comboBonus);
    gameState.score += points;
    gameState.power = Math.min(100, gameState.power + matches.length * 2);
    
    matches.forEach(function(pos) {
        gameState.grid[pos.row][pos.col].isMatched = true;
    });
    
    matches.forEach(function(pos) {
        const cell = gameState.grid[pos.row][pos.col].element;
        cell.classList.add('collecting');
    });
    
    setTimeout(function() {
        matches.forEach(function(pos) {
            gameState.grid[pos.row][pos.col].type = getRandomType();
            gameState.grid[pos.row][pos.col].isMatched = false;
            updateCellVisual(pos.row, pos.col);
        });
        gameState.comboCount = 0;
        updateUI();
    }, 300);
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('wave').textContent = gameState.wave;
    document.getElementById('power').textContent = gameState.power + '%';
    document.getElementById('hp').textContent = gameState.hp;
}

function startGame() {
    initGame();
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
}

function restartGame() {
    startGame();
}

// ============================================
// EVENTOS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }
    
    if (restartBtn) {
        restartBtn.addEventListener('click', restartGame);
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !gameState.isPlaying) {
            startGame();
        }
        if (e.key === 'r' || e.key === 'R') {
            restartGame();
        }
    });
    
    console.log('Battle of Glory loaded successfully!');
});
