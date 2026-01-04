// ============================================
// BATTLE OF GLORY - GAME LOGIC CON BONUS DE LÍNEA
// ============================================

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
    comboCount: 0,
    selectedHelmet: 'red'
};

// Tipos de cascos/gemas
const helmetTypes = ['red', 'blue', 'green', 'gold'];

// ============================================
// INICIALIZACIÓN
// ============================================

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

    // Actualizar UI
    updateUI();
    
    // Mostrar tablero
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.remove('visible');
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
            cell.onclick = () => handleCellClick(row, col);
            
            gridEl.appendChild(cell);
            
            gameState.grid[row][col] = {
                element: cell,
                type: getRandomHelmet(),
                isMatched: false,
                row: row,
                col: col
            };
            
            updateCellVisual(row, col);
        }
    }
    
    // Actualizar casco seleccionado
    updateHelmetSelection('red');
}

// ============================================
// HELMET SELECCIÓN
// ============================================

function selectHelmet(color) {
    gameState.selectedHelmet = color;
    updateHelmetSelection(color);
}

function updateHelmetSelection(color) {
    document.querySelectorAll('.helmet-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.color === color) {
            btn.classList.add('active');
        }
    });
}

// ============================================
// OBTENER HELMET ALEATORIO
// ============================================

function getRandomHelmet() {
    // 40% probabilidad de cada color, excepto gold que es menos común
    const rand = Math.random();
    if (rand < 0.15) return 'gold'; // 15% gold
    if (rand < 0.40) return 'red';  // 25% red
    if (rand < 0.70) return 'blue'; // 30% blue
    return 'green';                 // 30% green
}

// ============================================
// ACTUALIZAR VISUAL DE CELDA
// ============================================

function updateCellVisual(row, col) {
    const cellData = gameState.grid[row][col];
    const cell = cellData.element;
    const type = cellData.type;
    
    cell.innerHTML = `<div class="gem ${type}">${getHelmetEmoji(type)}</div>`;
    
    if (cellData.isMatched) {
        cell.querySelector('.gem').classList.add('matched');
    }
}

function getHelmetEmoji(type) {
    const emojis = {
        'red': '🔥',
        'blue': '❄️',
        'green': '🐍',
        'gold': '⭐'
    };
    return emojis[type] || '';
}

// ============================================
// MANEJO DE CLICKS
// ============================================

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
            swapHelmets(first, { row, col });
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
    
    // Verificar matches después del intercambio
    setTimeout(() => {
        checkMatches();
    }, 200);
}

// ============================================
// VERIFICAR MATCHES
// ============================================

function checkMatches() {
    let matches = [];
    
    // Buscar matches horizontales (3+ seguidos)
    for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
            const type = gameState.grid[row][col].type;
            if (type === gameState.grid[row][col + 1].type &&
                type === gameState.grid[row][col + 2].type) {
                
                // Encontró inicio de match horizontal
                let matchLen = 3;
                while (col + matchLen < 7 && 
                       gameState.grid[row][col + matchLen].type === type) {
                    matchLen++;
                }
                
                // Agregar todas las celdas del match
                for (let i = 0; i < matchLen; i++) {
                    matches.push({ row, col: col + i });
                }
            }
        }
    }
    
    // Buscar matches verticales (3+ seguidos)
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row < 5; row++) {
            const type = gameState.grid[row][col].type;
            if (type === gameState.grid[row + 1][col].type &&
                type === gameState.grid[row + 2][col].type) {
                
                // Encontró inicio de match vertical
                let matchLen = 3;
                while (row + matchLen < 7 && 
                       gameState.grid[row + matchLen][col].type === type) {
                    matchLen++;
                }
                
                // Agregar todas las celdas del match
                for (let i = 0; i < matchLen; i++) {
                    matches.push({ row: row + i, col });
                }
            }
        }
    }
    
    // Eliminar duplicados
    matches = matches.filter((pos, index, self) => 
        index === self.findIndex((p) => p.row === pos.row && p.col === pos.col)
    );
    
    if (matches.length > 0) {
        // Calcular puntos
        const basePoints = matches.length * 10;
        const comboBonus = gameState.comboCount * 5;
        const pointsEarned = basePoints + comboBonus;
        
        gameState.score += pointsEarned;
        gameState.power = Math.min(100, gameState.power + matches.length);
        
        // MOSTRAR PUNTOS FLOTANTES
        showFloatingPoints(pointsEarned, matches[0]);
        
        // MOSTRAR COMBO SI APLICA
        if (gameState.comboCount > 1) {
            showCombo(gameState.comboCount);
        }
        
        // Animación de match
        matches.forEach(pos => {
            gameState.grid[pos.row][pos.col].isMatched = true;
        });
        
        // Verificar línea completa (BONUS ÉPICO)
        const lineBonus = checkLineComplete();
        
        if (lineBonus > 0) {
            setTimeout(() => {
                showLineBonus(lineBonus);
            }, 300);
        }
        
        // Remover matched y rellenar
        setTimeout(() => {
            matches.forEach(pos => {
                gameState.grid[pos.row][pos.col].type = getRandomHelmet();
                gameState.grid[pos.row][pos.col].isMatched = false;
                updateCellVisual(pos.row, pos.col);
            });
            
            gameState.comboCount = 0;
            updateUI();
        }, 400);
    } else {
        gameState.comboCount = 0;
    }
}

// ============================================
// CHECK LÍNEA COMPLETA - BONUS ÉPICO
// ============================================

function checkLineComplete() {
    let lineBonus = 0;
    
    // Verificar cada fila
    for (let row = 0; row < 7; row++) {
        const firstType = gameState.grid[row][0].type;
        if (firstType && gameState.grid[row].every(cell => cell.type === firstType)) {
            // ¡Fila completa!
            lineBonus += 100;
            highlightLine('row', row);
        }
    }
    
    // Verificar cada columna
    for (let col = 0; col < 7; col++) {
        const firstType = gameState.grid[0][col].type;
        if (firstType && gameState.grid.every(row => row[col].type === firstType)) {
            // ¡Columna completa!
            lineBonus += 100;
            highlightLine('col', col);
        }
    }
    
    if (lineBonus > 0) {
        gameState.score += lineBonus;
        gameState.power = Math.min(100, gameState.power + 20);
    }
    
    return lineBonus;
}

function highlightLine(type, index) {
    for (let i = 0; i < 7; i++) {
        const pos = type === 'row' ? { row: index, col: i } : { row: i, col: index };
        const cell = gameState.grid[pos.row][pos.col].element;
        cell.style.animation = 'none';
        cell.offsetHeight; // Trigger reflow
        cell.style.animation = 'lineComplete 0.5s ease';
    }
}

// Añadir al CSS:
/*
@keyframes lineComplete {
    0% { background: rgba(255, 255, 255, 0.5); transform: scale(1); }
    50% { background: rgba(255, 215, 0, 0.8); transform: scale(1.1); }
    100% { background: rgba(255, 255, 255, 0.5); transform: scale(1); }
}
*/

// ============================================
// MOSTRAR PUNTOS FLOTANTES
// ============================================

function showFloatingPoints(points, position) {
    const gameArea = document.getElementById('game-area');
    
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = `+${points}`;
    
    // Obtener posición de la celda
    const cell = gameState.grid[position.row][position.col].element;
    const rect = cell.getBoundingClientRect();
    const areaRect = gameArea.getBoundingClientRect();
    
    popup.style.left = `${rect.left - areaRect.left + rect.width / 2}px`;
    popup.style.top = `${rect.top - areaRect.top + rect.height / 2}px`;
    
    gameArea.appendChild(popup);
    
    // Remover después de animación
    setTimeout(() => popup.remove(), 1500);
}

// ============================================
// MOSTRAR COMBO
// ============================================

function showCombo(count) {
    const gameArea = document.getElementById('game-area');
    
    const combo = document.createElement('div');
    combo.className = 'combo-display';
    combo.textContent = `${count}x COMBO!`;
    
    gameArea.appendChild(combo);
    
    setTimeout(() => combo.remove(), 1500);
}

// ============================================
// MOSTRAR BONUS DE LÍNEA
// ============================================

function showLineBonus(points) {
    const gameArea = document.getElementById('game-area');
    
    const bonus = document.createElement('div');
    bonus.className = 'score-popup';
    bonus.style.fontSize = '28px';
    bonus.style.color = '#ffd700';
    bonus.style.textShadow = '0 0 20px #ffd700, 3px 3px 0 #000';
    bonus.textContent = `LINE BONUS! +${points}`;
    
    bonus.style.left = '50%';
    bonus.style.top = '40%';
    bonus.style.transform = 'translate(-50%, -50%)';
    
    gameArea.appendChild(bonus);
    
    setTimeout(() => bonus.remove(), 2000);
}

// ============================================
// ACTUALIZAR UI
// ============================================

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('wave').textContent = gameState.wave;
    document.getElementById('power-text').textContent = `${gameState.power}%`;
    document.getElementById('power-bar').style.width = `${gameState.power}%`;
    document.getElementById('health-text').textContent = gameState.hp;
    document.getElementById('health-bar').style.width = `${gameState.hp}%`;
}

// ============================================
// CONTROLES DEL JUEGO
// ============================================

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
    document.getElementById('game-over').classList.add('visible');
}

// ============================================
// EVENTOS AL CARGAR
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Botón start
    document.getElementById('start-btn').onclick = startGame;
    
    // Botón restart
    document.getElementById('restart-btn').onclick = restartGame;
    
    // Controles de teclado
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !gameState.isPlaying) {
            startGame();
        }
        if ((e.key === 'r' || e.key === 'R') && !gameState.isPlaying) {
            restartGame();
        }
    });
    
    console.log('Battle of Glory loaded successfully!');
});
