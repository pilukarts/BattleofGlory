// Battle of Glory - Game Logic

const gameState = {
    isPlaying: false,
    score: 0,
    wave: 1,
    power: 0,
    hp: 100,
    grid: [],
    selectedCell: null,
    comboCount: 0,
    selectedHelmet: 'red'
};

const helmetTypes = ['red', 'blue', 'green', 'gold'];

function initGame() {
    const gridEl = document.getElementById('game-grid');
    gridEl.innerHTML = '';
    gameState.grid = [];
    gameState.score = 0;
    gameState.wave = 1;
    gameState.power = 0;
    gameState.hp = 100;
    gameState.selectedCell = null;
    gameState.comboCount = 0;
    gameState.isPlaying = true;
    gameState.selectedHelmet = 'red';

    updateUI();
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-grid').style.display = 'grid';
    document.getElementById('helmet-selector').style.display = 'flex';
    document.getElementById('instructions').style.display = 'block';

    // Crear grid 7x7
    for (let row = 0; row < 7; row++) {
        gameState.grid[row] = [];
        for (let col = 0; col < 7; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.onclick = function() { handleCellClick(row, col); };
            
            gridEl.appendChild(cell);
            
            gameState.grid[row][col] = {
                element: cell,
                type: getRandomHelmet(),
                isMatched: false
            };
            
            updateCellVisual(row, col);
        }
    }
    
    updateHelmetSelection('red');
}

function selectHelmet(color) {
    gameState.selectedHelmet = color;
    updateHelmetSelection(color);
}

function updateHelmetSelection(color) {
    document.querySelectorAll('.helmet-btn').forEach(function(btn) {
        btn.classList.remove('active');
        if (btn.dataset.color === color) {
            btn.classList.add('active');
        }
    });
}

function getRandomHelmet() {
    const rand = Math.random();
    if (rand < 0.15) return 'gold';
    if (rand < 0.40) return 'red';
    if (rand < 0.70) return 'blue';
    return 'green';
}

function updateCellVisual(row, col) {
    const cellData = gameState.grid[row][col];
    const cell = cellData.element;
    const type = cellData.type;
    
    const emojis = {'red': '🔥', 'blue': '❄️', 'green': '🐍', 'gold': '⭐'};
    cell.innerHTML = '<div class="gem ' + type + '">' + emojis[type] + '</div>';
}

function handleCellClick(row, col) {
    if (!gameState.isPlaying) return;

    const clickedCell = gameState.grid[row][col];

    if (gameState.selectedCell === null) {
        gameState.selectedCell = {row: row, col: col};
        clickedCell.element.classList.add('selected');
    } else {
        const first = gameState.selectedCell;
        clickedCell.element.classList.remove('selected');
        first.element.classList.remove('selected');
        
        if (isAdjacent(first, {row: row, col: col})) {
            swapHelmets(first, {row: row, col: col});
        }
        
        gameState.selectedCell = null;
    }
}

function isAdjacent(cell1, cell2) {
    const rowDiff = Math.abs(cell1.row - cell2.row);
    const colDiff = Math.abs(cell1.col - cell2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function swapHelmets(cell1, cell2) {
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
                matches.push({row: row, col: col});
                matches.push({row: row, col: col + 1});
                matches.push({row: row, col: col + 2});
            }
        }
    }
    
    // Vertical
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 7; col++) {
            const type = gameState.grid[row][col].type;
            if (type === gameState.grid[row + 1][col].type &&
                type === gameState.grid[row + 2][col].type) {
                matches.push({row: row, col: col});
                matches.push({row: row + 1, col: col});
                matches.push({row: row + 2, col: col});
            }
        }
    }
    
    // Eliminar duplicados
    matches = matches.filter(function(pos, index) {
        return index === matches.findIndex(function(p) {
            return p.row === pos.row && p.col === pos.col;
        });
    });
    
    if (matches.length > 0) {
        const points = matches.length * 10 + gameState.comboCount * 5;
        gameState.score += points;
        gameState.power = Math.min(100, gameState.power + matches.length);
        
        showFloatingPoints(points, matches[0]);
        
        if (gameState.comboCount > 1) {
            showCombo(gameState.comboCount);
        }
        
        matches.forEach(function(pos) {
            gameState.grid[pos.row][pos.col].isMatched = true;
            gameState.grid[pos.row][pos.col].element.classList.add('matched');
        });
        
        setTimeout(function() {
            matches.forEach(function(pos) {
                gameState.grid[pos.row][pos.col].type = getRandomHelmet();
                gameState.grid[pos.row][pos.col].isMatched = false;
                gameState.grid[pos.row][pos.col].element.classList.remove('matched');
                updateCellVisual(pos.row, pos.col);
            });
            gameState.comboCount = 0;
            updateUI();
        }, 400);
    } else {
        gameState.comboCount = 0;
    }
}

function showFloatingPoints(points, position) {
    const gameArea = document.getElementById('game-area');
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = '+' + points;
    
    const cell = gameState.grid[position.row][position.col].element;
    const rect = cell.getBoundingClientRect();
    const areaRect = gameArea.getBoundingClientRect();
    
    popup.style.left = (rect.left - areaRect.left + rect.width / 2) + 'px';
    popup.style.top = (rect.top - areaRect.top + rect.height / 2) + 'px';
    
    gameArea.appendChild(popup);
    
    setTimeout(function() { popup.remove(); }, 1500);
}

function showCombo(count) {
    const gameArea = document.getElementById('game-area');
    const combo = document.createElement('div');
    combo.className = 'combo-display';
    combo.textContent = count + 'x COMBO!';
    gameArea.appendChild(combo);
    setTimeout(function() { combo.remove(); }, 1500);
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('wave').textContent = gameState.wave;
    document.getElementById('power-text').textContent = gameState.power + '%';
    document.getElementById('power-bar').style.width = gameState.power + '%';
    document.getElementById('health-text').textContent = gameState.hp;
    document.getElementById('health-bar').style.width = gameState.hp + '%';
}

function startGame() {
    initGame();
}

function restartGame() {
    initGame();
}

function gameOver() {
    gameState.isPlaying = false;
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-wave').textContent = gameState.wave;
    document.getElementById('game-over').style.display = 'flex';
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Battle of Glory loaded!');
});
