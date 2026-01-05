// Battle of Glory - Slot Machine Logic con BONUS

const gameState = {
    isPlaying: false,
    isBonusMode: false,
    bonusSpins: 0,
    score: 0,
    wave: 1,
    progress: 0,
    lives: 3,
    isSpinning: false
};

// Configuración de gemas
const gemConfig = {
    red: { value: 5, weight: 35 },
    blue: { value: 10, weight: 30 },
    green: { value: 15, weight: 25 },
    gold: { value: 20, weight: 10 }
};

// Inicializar el juego
function initGame() {
    gameState.isPlaying = true;
    gameState.isBonusMode = false;
    gameState.bonusSpins = 0;
    gameState.score = 0;
    gameState.wave = 1;
    gameState.progress = 0;
    gameState.lives = 3;
    gameState.isSpinning = false;

    updateUI();
    updateLives();
    updateProgress();
    
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('bonus-screen').style.display = 'none';
    document.getElementById('slot-area').style.display = 'flex';
    
    generateInitialGems();
    
    console.log('Battle of Glory started!');
}

// Generar gemas iniciales
function generateInitialGems() {
    for (let reel = 0; reel < 4; reel++) {
        const reelEl = document.getElementById('reel-' + reel);
        reelEl.innerHTML = '';
        
        for (let i = 0; i < 5; i++) {
            const gem = createGemElement(getRandomGem());
            reelEl.appendChild(gem);
        }
    }
}

// Obtener gema aleatoria según pesos
function getRandomGem() {
    const rand = Math.random() * 100;
    let cumulative = 0;
    
    for (const [type, config] of Object.entries(gemConfig)) {
        cumulative += config.weight;
        if (rand <= cumulative) {
            return type;
        }
    }
    
    return 'red';
}

// Crear elemento de gema
function createGemElement(type) {
    const div = document.createElement('div');
    div.className = 'slot-gem ' + type;
    div.dataset.type = type;
    div.textContent = gemConfig[type].value;
    return div;
}

// Girar los slots
function spinSlots() {
    if (gameState.isSpinning || !gameState.isPlaying) return;
    
    // Verificar si estamos en modo bonus
    if (gameState.isBonusMode) {
        gameState.bonusSpins--;
        if (gameState.bonusSpins <= 0) {
            endGame();
            return;
        }
        updateBonusUI();
    }
    
    gameState.isSpinning = true;
    document.getElementById('slot-btn').disabled = true;
    
    // Cerrar cofre si está abierto
    document.getElementById('chest').classList.remove('open');
    
    // Animación de giro
    for (let reel = 0; reel < 4; reel++) {
        animateReel(reel);
    }
    
    // Terminar giro
    setTimeout(function() {
        finishSpin();
    }, 2500);
}

// Animar reel individual
function animateReel(reelIndex) {
    const reelEl = document.getElementById('reel-' + reelIndex);
    const interval = setInterval(function() {
        reelEl.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const tempGem = createGemElement(getRandomGem());
            tempGem.style.opacity = '0.5';
            reelEl.appendChild(tempGem);
        }
    }, 100);
    
    setTimeout(function() {
        clearInterval(interval);
    }, 1000 + Math.random() * 1500);
}

// Terminar giro y calcular resultados
function finishSpin() {
    let totalPoints = 0;
    
    for (let reel = 0; reel < 4; reel++) {
        const reelEl = document.getElementById('reel-' + reel);
        reelEl.innerHTML = '';
        
        const result = getReelResult();
        const gem = createGemElement(result.type);
        reelEl.appendChild(gem);
        
        const points = result.value;
        totalPoints += points;
        
        showFloatingPoints(points, gem);
    }
    
    // Actualizar score
    gameState.score += totalPoints;
    
    // Actualizar progreso (solo si NO está en modo bonus)
    if (!gameState.isBonusMode) {
        gameState.progress += totalPoints;
        
        // Verificar cofre (100 puntos)
        if (gameState.progress >= 100) {
            gameState.progress = 0;
            openChest();
        }
        
        // Verificar vidas (si no hay gemas doradas)
        const results = getAllResults();
        const hasGold = results.some(r => r.type === 'gold');
        
        if (!hasGold && Math.random() < 0.3) {
            loseLife();
        }
    } else {
        // En modo bonus, siempre se abre el cofre
        if (gameState.progress >= 100) {
            gameState.progress = 0;
            openChest();
        }
        gameState.progress += totalPoints;
    }
    
    updateUI();
    updateProgress();
    
    gameState.isSpinning = false;
    document.getElementById('slot-btn').disabled = false;
}

// Obtener resultado de un reel
function getReelResult() {
    const rand = Math.random() * 100;
    let cumulative = 0;
    
    for (const [type, config] of Object.entries(gemConfig)) {
        cumulative += config.weight;
        if (rand <= cumulative) {
            return { type: type, value: config.value };
        }
    }
    
    return { type: 'red', value: 5 };
}

// Obtener todos los resultados
function getAllResults() {
    const results = [];
    for (let i = 0; i < 4; i++) {
        results.push(getReelResult());
    }
    return results;
}

// Abrir cofre de bonus
function openChest() {
    const chest = document.getElementById('chest');
    chest.classList.add('open');
    
    const bonusPoints = gameState.isBonusMode ? 100 : 50;
    gameState.score += bonusPoints;
    gameState.progress = 0;
    
    showFloatingPoints(bonusPoints, chest);
    
    updateUI();
    
    setTimeout(function() {
        chest.classList.remove('open');
    }, 2000);
}

// Perder una vida
function loseLife() {
    gameState.lives--;
    updateLives();
    
    if (gameState.lives <= 0) {
        // EN LUGAR DE GAME OVER, IR AL BONUS
        enterBonusMode();
    }
}

// Entrar al modo BONUS con 10 tiradas gratis
function enterBonusMode() {
    gameState.isBonusMode = true;
    gameState.bonusSpins = 10;
    gameState.progress = 0;
    gameState.lives = 3;
    
    // Mostrar pantalla de bonus
    document.getElementById('slot-area').style.display = 'none';
    document.getElementById('bonus-screen').style.display = 'flex';
    
    updateBonusUI();
    updateLives();
    
    console.log('BONUS MODE ACTIVATED! 10 Free Spins!');
}

// Pantalla de bonus
function updateBonusUI() {
    const spinsEl = document.getElementById('bonus-spins');
    const progressEl = document.getElementById('bonus-progress');
    
    if (spinsEl) {
        spinsEl.textContent = gameState.bonusSpins;
    }
    
    if (progressEl) {
        progressEl.textContent = gameState.progress + ' / 100';
    }
}

// Actualizar UI
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('wave').textContent = gameState.wave;
}

// Actualizar vidas
function updateLives() {
    const skulls = document.querySelectorAll('.skull');
    skulls.forEach(function(skull, index) {
        if (index < gameState.lives) {
            skull.classList.add('active');
            skull.classList.remove('lost');
        } else {
            skull.classList.remove('active');
            skull.classList.add('lost');
        }
    });
}

// Actualizar progress bar
function updateProgress() {
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    
    const percentage = Math.min(100, gameState.progress);
    fill.style.width = percentage + '%';
    text.textContent = gameState.progress + ' / 100';
}

// Mostrar puntos flotantes
function showFloatingPoints(points, element) {
    const gameContainer = document.getElementById('game-container');
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = '+' + points;
    
    const rect = element.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    
    popup.style.left = (rect.left - containerRect.left + rect.width / 2) + 'px';
    popup.style.top = (rect.top - containerRect.top + rect.height / 2) + 'px';
    
    gameContainer.appendChild(popup);
    
    setTimeout(function() {
        popup.remove();
    }, 1500);
}

// Terminar juego
function endGame() {
    gameState.isPlaying = false;
    gameState.isBonusMode = false;
    document.getElementById('bonus-screen').style.display = 'none';
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('game-over').style.display = 'flex';
}

// Iniciar juego
function startGame() {
    initGame();
}

// Reiniciar juego
function restartGame() {
    initGame();
}

// Event listeners al cargar
document.addEventListener('DOMContentLoaded', function() {
    console.log('Battle of Glory loaded!');
});
