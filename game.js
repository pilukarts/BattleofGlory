cat > game.js << 'ENDOFFILE'
const CONFIG = {
    GRID_ROWS: 8,
    GRID_COLS: 7,
    GEM_SPAWN_RATE: 0.35,
    ENEMY_SPAWN_RATE: 0.12,
    ENEMY_MOVE_INTERVAL: 1800,
    WAVE_DIFFICULTY: 1.15,
    SPECIAL_POWER_COST: 100,
    MAX_HEALTH: 100,
    HELMET_STATS: {
        red: { color: '#ff4444', gemColor: 'red', range: 1, damage: 25, name: 'INFERNO' },
        blue: { color: '#00d4ff', gemColor: 'blue', range: 2, damage: 15, name: 'GLACIER' },
        green: { color: '#44ff44', gemColor: 'green', range: 3, damage: 10, name: 'VIPER' },
        gold: { color: '#ffd700', gemColor: 'all', range: 2, damage: 35, name: 'CELESTIAL' }
    }
};

let gameState = {
    score: 0,
    wave: 1,
    health: 100,
    power: 0,
    selectedHelmet: 'red',
    helmets: [],
    gems: [],
    enemies: [],
    isPlaying: false,
    enemyMoveInterval: null,
    isSpecialActive: false
};

const gridElement = document.getElementById('game-grid');
const scoreElement = document.getElementById('score');
const waveElement = document.getElementById('wave');
const powerBar = document.getElementById('power-bar');
const powerText = document.getElementById('power-text');
const healthBar = document.getElementById('health-bar');
const healthText = document.getElementById('health-text');
const helmetButtons = document.querySelectorAll('.helmet-btn');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');

const SVG_TEMPLATES = {
    helmet: {
        red: `<svg viewBox="0 0 60 60" class="helmet"><defs><linearGradient id="ir" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#ff4444"/><stop offset="50%" style="stop-color:#cc0000"/><stop offset="100%" style="stop-color:#880000"/></linearGradient></defs><path d="M30 5 L50 15 L55 35 L48 52 L42 55 L18 55 L12 52 L5 35 L10 15 Z" fill="url(#ir)" stroke="#550000" stroke-width="2"/><polygon points="18,28 26,25 30,35 26,45 18,45 14,35" fill="#ff2200"/><polygon points="34,28 42,25 46,35 42,45 34,45 30,35" fill="#ff2200"/><line x1="30" y1="25" x2="30" y2="50" stroke="#550000" stroke-width="2"/><text x="30" y="18" text-anchor="middle" font-size="8" font-weight="bold" fill="#ff6666">PB</text></svg>`,
        blue: `<svg viewBox="0 0 60 60" class="helmet"><defs><linearGradient id="ib" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#00d4ff"/><stop offset="50%" style="stop-color:#0088cc"/><stop offset="100%" style="stop-color:#004466"/></linearGradient></defs><ellipse cx="30" cy="28" rx="24" ry="24" fill="url(#ib)" stroke="#003355" stroke-width="2"/><polygon points="22,20 30,15 38,20 38,30 30,35 22,30" fill="#00ffff"/><polygon points="26,32 30,28 34,32 34,38 30,42 26,38" fill="#0088ff" opacity="0.8"/><text x="30" y="48" text-anchor="middle" font-size="8" font-weight="bold" fill="#00ffff">PB</text></svg>`,
        green: `<svg viewBox="0 0 60 60" class="helmet"><defs><linearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#44ff44"/><stop offset="50%" style="stop-color:#00aa00"/><stop offset="100%" style="stop-color:#005500"/></linearGradient></defs><path d="M30 5 L48 20 L52 35 L45 50 L35 55 L25 55 L15 50 L8 35 L12 20 Z" fill="url(#ig)" stroke="#003300" stroke-width="2"/><ellipse cx="22" cy="26" rx="6" ry="4" fill="#00ff00"/><ellipse cx="38" cy="26" rx="6" ry="4" fill="#00ff00"/><ellipse cx="22" cy="26" rx="3" ry="2" fill="#ccffcc"/><ellipse cx="38" cy="26" rx="3" ry="2" fill="#ccffcc"/><text x="30" y="45" text-anchor="middle" font-size="7" font-weight="bold" fill="#44ff44">PB</text></svg>`,
        gold: `<svg viewBox="0 0 60 60" class="helmet"><defs><radialGradient id="ic" cx="50%" cy="40%" r="60%"><stop offset="0%" style="stop-color:#ffffff"/><stop offset="30%" style="stop-color:#ffd700"/><stop offset="100%" style="stop-color:#b8860b"/></radialGradient></defs><ellipse cx="30" cy="32" rx="25" ry="26" fill="url(#ic)" stroke="#8B7500" stroke-width="2"/><ellipse cx="30" cy="25" rx="16" ry="10" fill="none" stroke="#fff" stroke-width="2" opacity="0.8"/><circle cx="30" cy="32" r="14" fill="#1a1a00" stroke="#ffd700" stroke-width="2"/><circle cx="30" cy="32" r="10" fill="#ffd700" opacity="0.9"/><circle cx="30" cy="32" r="6" fill="#fff"/><text x="30" y="12" text-anchor="middle" font-size="9" font-weight="bold" fill="#ffd700">PB</text></svg>`
    },
    enemy: `<svg viewBox="0 0 50 50"><defs><radialGradient id="er" cx="50%" cy="30%" r="60%"><stop offset="0%" style="stop-color:#636e72"/><stop offset="100%" style="stop-color:#2d3436"/></radialGradient></defs><ellipse cx="25" cy="25" rx="18" ry="16" fill="url(#er)" stroke="#1a1a1a" stroke-width="2"/><circle cx="18" cy="22" r="5" fill="#e74c3c"/><circle cx="32" cy="22" r="5" fill="#e74c3c"/><circle cx="18" cy="22" r="2" fill="#fff"/><circle cx="32" cy="22" r="2" fill="#fff"/><rect x="15" y="35" width="20" height="4" rx="2" fill="#1a1a1a"/></svg>`
};

function initGrid() {
    gridElement.innerHTML = '';
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
        for (let col = 0; col < CONFIG.GRID_COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => handleCellClick(row, col));
            gridElement.appendChild(cell);
        }
    }
}

function spawnHelmets() {
    gameState.helmets = [];
    const positions = [
        { row: 3, col: 2, color: 'red' },
        { row: 3, col: 4, color: 'blue' },
        { row: 4, col: 3, color: 'green' },
        { row: 2, col: 3, color: 'gold' }
    ];
    positions.forEach(pos => {
        gameState.helmets.push({ row: pos.row, col: pos.col, color: pos.color });
        renderHelmet(pos.row, pos.col, pos.color);
    });
}

function renderHelmet(row, col, color) {
    const cell = getCell(row, col);
    const existingHelmet = cell.querySelector('.helmet');
    if (existingHelmet) existingHelmet.remove();
    const helmetDiv = document.createElement('div');
    helmetDiv.className = `helmet ${color}-helmet`;
    if (gameState.selectedHelmet === color) helmetDiv.classList.add('selected');
    helmetDiv.innerHTML = SVG_TEMPLATES.helmet[color];
    cell.appendChild(helmetDiv);
}

function getCell(row, col) {
    return gridElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function startGame() {
    gameState = { score: 0, wave: 1, health: 100, power: 0, selectedHelmet: 'red', helmets: [], gems: [], enemies: [], isPlaying: true, enemyMoveInterval: null, isSpecialActive: false };
    initGrid();
    spawnHelmets();
    updateUI();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    startEnemyMovement();
    for (let i = 0; i < 6; i++) spawnGem();
    spawnEnemy();
    spawnEnemy();
    updateHelmetButtons();
}

function startEnemyMovement() {
    if (gameState.enemyMoveInterval) clearInterval(gameState.enemyMoveInterval);
    gameState.enemyMoveInterval = setInterval(() => {
        if (!gameState.isPlaying) return;
        moveEnemies();
        checkWaveProgress();
    }, CONFIG.ENEMY_MOVE_INTERVAL);
}

function spawnGem() {
    const colors = ['red', 'blue', 'green', 'gold'];
    const availableColors = gameState.power >= CONFIG.SPECIAL_POWER_COST ? colors : colors.slice(0, 3);
    const color = availableColors[Math.floor(Math.random() * availableColors.length)];
    let row, col, attempts = 0;
    do {
        row = Math.floor(Math.random() * (CONFIG.GRID_ROWS - 1));
        col = Math.floor(Math.random() * CONFIG.GRID_COLS);
        attempts++;
    } while (isOccupied(row, col) && attempts < 20);
    if (attempts < 20) {
        gameState.gems.push({ row, col, color });
        renderGem(row, col, color);
    }
}

function renderGem(row, col, color) {
    const cell = getCell(row, col);
    const gemDiv = document.createElement('div');
    gemDiv.className = `gem gem-${color}`;
    gemDiv.id = `gem-${row}-${col}`;
    cell.appendChild(gemDiv);
}

function spawnEnemy() {
    let row = 0, col, attempts = 0;
    do {
        col = Math.floor(Math.random() * CONFIG.GRID_COLS);
        attempts++;
    } while (isOccupied(row, col) && attempts < 10);
    if (attempts < 10) {
        const baseHealth = 25 + (gameState.wave * 8);
        gameState.enemies.push({ row, col, health: baseHealth, maxHealth: baseHealth });
        renderEnemy(row, col, baseHealth);
    }
}

function renderEnemy(row, col, health) {
    const cell = getCell(row, col);
    const existingEnemy = cell.querySelector('.enemy');
    if (existingEnemy) existingEnemy.remove();
    const enemyDiv = document.createElement('div');
    enemyDiv.className = 'enemy';
    enemyDiv.innerHTML = SVG_TEMPLATES.enemy;
    const healthBar = document.createElement('div');
    healthBar.className = 'enemy-health';
    const healthFill = document.createElement('div');
    healthFill.className = 'enemy-health-bar';
    healthFill.style.width = `${Math.max((health / (25 + gameState.wave * 8)) * 100, 10)}%`;
    healthBar.appendChild(healthFill);
    enemyDiv.appendChild(healthBar);
    cell.appendChild(enemyDiv);
}

function isOccupied(row, col) {
    return gameState.helmets.some(h => h.row === row && h.col === col) ||
           gameState.gems.some(g => g.row === row && g.col === col) ||
           gameState.enemies.some(e => e.row === row && e.col === col);
}

function handleCellClick(row, col) {
    if (!gameState.isPlaying || gameState.isSpecialActive) return;
    const helmet = gameState.helmets.find(h => h.color === gameState.selectedHelmet);
    if (!helmet) return;
    const rowDiff = Math.abs(row - helmet.row);
    const colDiff = Math.abs(col - helmet.col);
    const stats = CONFIG.HELMET_STATS[helmet.color];
    const isValidMove = (rowDiff <= stats.range && colDiff <= stats.range) && (rowDiff + colDiff > 0);
    if (isValidMove) moveHelmet(helmet, row, col);
}

function moveHelmet(helmet, targetRow, targetCol) {
    const oldCell = getCell(helmet.row, helmet.col);
    const oldHelmet = oldCell.querySelector('.helmet');
    if (oldHelmet) oldHelmet.remove();
    const gemIndex = gameState.gems.findIndex(g => g.row === targetRow && g.col === targetCol);
    if (gemIndex !== -1) {
        const gem = gameState.gems[gemIndex];
        const stats = CONFIG.HELMET_STATS[helmet.color];
        if (stats.gemColor === 'all' || gem.color === stats.gemColor) collectGem(gemIndex, targetRow, targetCol);
    }
    const enemyIndex = gameState.enemies.findIndex(e => e.row === targetRow && e.col === targetCol);
    if (enemyIndex !== -1) attackEnemy(enemyIndex, helmet.color, targetRow, targetCol);
    helmet.row = targetRow;
    helmet.col = targetCol;
    renderHelmet(targetRow, targetCol, helmet.color);
}

function collectGem(gemIndex, row, col) {
    const gem = gameState.gems[gemIndex];
    const cell = getCell(row, col);
    const gemElement = cell.querySelector('.gem');
    if (gemElement) { gemElement.classList.add('effect-collect'); setTimeout(() => gemElement.remove(), 350); }
    let points = 10, powerGain = 5;
    if (gem.color === 'gold') { points = 25; powerGain = 15; }
    gameState.score += points;
    gameState.power = Math.min(gameState.power + powerGain, CONFIG.SPECIAL_POWER_COST);
    showScorePopup(row, col, gem.color === 'gold' ? `+${points}` : `+${points}`);
    gameState.gems.splice(gemIndex, 1);
    updateUI();
    if (gameState.selectedHelmet === 'gold' && gameState.power >= CONFIG.SPECIAL_POWER_COST) activateSpecialPower();
}

function attackEnemy(enemyIndex, helmetColor, row, col) {
    const enemy = gameState.enemies[enemyIndex];
    const damage = CONFIG.HELMET_STATS[helmetColor].damage;
    enemy.health -= damage;
    const cell = getCell(row, col);
    cell.classList.add('damage-flash');
    setTimeout(() => cell.classList.remove('damage-flash'), 250);
    if (enemy.health <= 0) {
        const enemyElement = cell.querySelector('.enemy');
        if (enemyElement) { enemyElement.classList.add('effect-explosion'); setTimeout(() => enemyElement.remove(), 400); }
        gameState.enemies.splice(enemyIndex, 1);
        gameState.score += 50;
        gameState.power = Math.min(gameState.power + 8, CONFIG.SPECIAL_POWER_COST);
        showScorePopup(row, col, '+50');
        updateUI();
    } else { renderEnemy(row, col, enemy.health); }
}

function activateSpecialPower() {
    gameState.isSpecialActive = true;
    gridElement.classList.add('special-active');
    gameState.enemies.forEach(enemy => {
        const cell = getCell(enemy.row, enemy.col);
        if (cell) { const enemyElement = cell.querySelector('.enemy'); if (enemyElement) enemyElement.classList.add('effect-explosion'); }
    });
    setTimeout(() => {
        gameState.enemies = [];
        gameState.gems.forEach(gem => {
            const cell = getCell(gem.row, gem.col);
            if (cell) { const gemElement = cell.querySelector('.gem'); if (gemElement) gemElement.classList.add('effect-collect'); }
        });
        setTimeout(() => {
            gameState.gems = [];
            gameState.score += 300;
            gameState.power = 0;
            showScorePopup(3, 3, 'SUPERNOVA! +300');
            gridElement.classList.remove('special-active');
            gameState.isSpecialActive = false;
            for (let i = 0; i < 2 + gameState.wave; i++) setTimeout(() => spawnEnemy(), i * 250);
            for (let i = 0; i < 4; i++) setTimeout(() => spawnGem(), i * 180);
            updateUI();
        }, 350);
    }, 400);
}

function showScorePopup(row, col, text) {
    const cell = getCell(row, col);
    if (!cell) return;
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = text;
    cell.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
}

function moveEnemies() {
    gameState.enemies.forEach(enemy => {
        const oldCell = getCell(enemy.row, enemy.col);
        const oldEnemy = oldCell?.querySelector('.enemy');
        if (oldEnemy) oldEnemy.remove();
        enemy.row++;
        if (enemy.row >= CONFIG.GRID_ROWS - 1) {
            gameState.health -= 10;
            enemy.row = CONFIG.GRID_ROWS;
            gridElement.classList.add('shake');
            setTimeout(() => gridElement.classList.remove('shake'), 250);
        } else { renderEnemy(enemy.row, enemy.col, enemy.health); }
    });
    gameState.enemies = gameState.enemies.filter(e => e.row < CONFIG.GRID_ROWS);
    updateUI();
    if (gameState.health <= 0) gameOver();
}

function checkWaveProgress() {
    const newWave = Math.floor(gameState.score / 400) + 1;
    if (newWave > gameState.wave) {
        gameState.wave = newWave;
        for (let i = 0; i < 2 + gameState.wave; i++) setTimeout(() => spawnGem(), i * 180);
        spawnEnemy();
    }
    if (Math.random() < CONFIG.GEM_SPAWN_RATE) spawnGem();
    if (Math.random() < CONFIG.ENEMY_SPAWN_RATE + (gameState.wave * 0.03)) spawnEnemy();
}

function selectHelmet(color) {
    if (gameState.isSpecialActive) return;
    gameState.selectedHelmet = color;
    updateHelmetButtons();
    gameState.helmets.forEach(helmet => renderHelmet(helmet.row, helmet.col, helmet.color));
}

function updateHelmetButtons() {
    helmetButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.color === gameState.selectedHelmet) btn.classList.add('active');
    });
}

function updateUI() {
    scoreElement.textContent = gameState.score;
    waveElement.textContent = gameState.wave;
    powerBar.style.width = `${gameState.power}%`;
    powerText.textContent = `${gameState.power}%`;
    const healthPercent = Math.max(gameState.health, 0);
    healthBar.style.width = `${healthPercent}%`;
    healthText.textContent = Math.max(gameState.health, 0);
    if (healthPercent <= 25) healthBar.style.background = 'linear-gradient(90deg, #c0392b, #e74c3c)';
    else if (healthPercent <= 50) healthBar.style.background = 'linear-gradient(90deg, #e67e22, #f39c12)';
    else healthBar.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71, #58d68d)';
}

function gameOver() {
    gameState.isPlaying = false;
    if (gameState.enemyMoveInterval) clearInterval(gameState.enemyMoveInterval);
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-wave').textContent = gameState.wave;
    gameOverScreen.classList.remove('hidden');
}

function restartGame() {
    gameOverScreen.classList.add('hidden');
    startGame();
}

document.addEventListener('DOMContentLoaded', () => initGrid());
document.addEventListener('contextmenu', (e) => e.preventDefault());
ENDOFFILE
