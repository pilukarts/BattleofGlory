// Battle of Glory - Game Logic
// Minimum Viable Product (MVP) v1.0

// ============================================
// ESTADO DEL JUEGO
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

const gemTypes = ['red', 'blue', 'green', 'gold'];

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Event listeners para botones
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    
    // Keyboard controls
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

// ============================================
// FUNCIONES DEL JUEGO
// ============================================

function startGame() {
    // Ocultar pantalla de inicio con transición suave
    document.getElementById('start-screen').classList.remove('active');
    
    // Inicializar juego después de la transición
    setTimeout(function() {
        initGame();
    }, 300);
}

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

    // Crear grid 7x7
    for (let row = 0; row < 7; row++) {
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

    // Mostrar grid con animación
    grid.classList.add('active');
    
    updateUI();
}

function getRandomType() {
    return gemTypes[Math.floor(Math.random() * gemTypes.length)];
}

function updateCellVisual(row, col) {
    const cellData = gameState.grid[row][col];
    const cell = cellData.element;
    
    cell.innerHTML = '<div class="gem ' + cellData.type + '"></div>';
}

function handleCellClick(row, col) {
    if (!gameState.isPlaying) return;

    const clickedCell = gameState.grid[row][col];

    if (gameState.selectedCell === null) {
        // Primera selección
        gameState.selectedCell = { row, col };
        clickedCell.element.classList.add('selected');
    } else {
        // Segunda selección
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
    
    // Horizontal
    for (let row = 0; row < 7; row++) {
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
    
    // Vertical
    for (let row = 0; row < 5; row++) {
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
    
    // Calcular puntos
    const basePoints = 10;
    const comboBonus = gameState.comboCount * 5;
    const points = matches.length * (basePoints + comboBonus);
    gameState.score += points;
    gameState.power = Math.min(100, gameState.power + matches.length * 2);
    
    // Mostrar popup de puntuación
    showScorePopup(points);
    
    // Animar matches
    matches.forEach(function(pos) {
        gameState.grid[pos.row][pos.col].element.classList.add('matched');
    });
    
    setTimeout(function() {
        matches.forEach(function(pos) {
            gameState.grid[pos.row][pos.col].type = getRandomType();
            gameState.grid[pos.row][pos.col].element.classList.remove('matched');
            updateCellVisual(pos.row, pos.col);
        });
        gameState.comboCount = 0;
        updateUI();
    }, 300);
}

function showScorePopup(points) {
    const popup = document.getElementById('score-popup');
    popup.textContent = '+' + points;
    popup.classList.remove('show');
    
    // Trigger reflow para reiniciar animación
    void popup.offsetWidth;
    
    popup.classList.add('show');
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('wave').textContent = gameState.wave;
    document.getElementById('power').textContent = gameState.power + '%';
    document.getElementById('hp').textContent = gameState.hp;
    
    document.getElementById('power-bar').style.width = gameState.power + '%';
    document.getElementById('health-bar').style.width = gameState.hp + '%';
}

function showGameOver() {
    gameState.isPlaying = false;
    document.getElementById('game-grid').classList.remove('active');
    
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-wave').textContent = gameState.wave;
    
    setTimeout(function() {
        document.getElementById('game-over-screen').classList.add('active');
    }, 300);
}

function restartGame() {
    document.getElementById('game-over-screen').classList.remove('active');
    startGame();
}
