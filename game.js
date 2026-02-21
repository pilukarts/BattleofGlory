/**
 * Battle of Glory - Slot Machine Game
 * Versión corregida y optimizada
 */

'use strict';

// ============ CONFIGURACIÓN GLOBAL ============

const CONFIG = {
    // Gemas y sus probabilidades
    GEMS: {
        red: { value: 5, weight: 35, color: '#ff4444', name: 'Rubi', icon: '🔴' },
        blue: { value: 10, weight: 30, color: '#4444ff', name: 'Zafiro', icon: '🔵' },
        green: { value: 15, weight: 25, color: '#44ff44', name: 'Esmeralda', icon: '🟢' },
        gold: { value: 20, weight: 10, color: '#ffdd00', name: 'Oro', icon: '🟡' }
    },
    
    // Configuración de juego
    GAME: {
        initialLives: 3,
        bonusSpins: 10,
        chestThreshold: 100,
        spinDuration: 2500,
        reelStopDelay: 400
    },
    
    // Audio (frecuencias para generar sonidos)
    AUDIO: {
        spin: 440,      // A4
        win: 880,       // A5
        chest: 660,     // E5
        bonus: 550,     // C#5
        lose: 220       // A3
    }
};

// ============ ESTADO DEL JUEGO ============

const state = {
    isPlaying: false,
    isBonusMode: false,
    isSpinning: false,
    isMuted: false,
    
    // Stats
    score: 0,
    wave: 1,
    progress: 0,
    lives: 3,
    bonusSpins: 0,
    totalGems: 0,
    
    // Audio
    audioContext: null,
    
    // Referencias DOM
    dom: {}
};

// ============ INICIALIZACIÓN ============

/**
 * Cachea todos los elementos DOM necesarios
 */
function cacheDOM() {
    const elements = {
        // Screens
        startScreen: 'start-screen',
        slotArea: 'slot-area',
        bonusScreen: 'bonus-screen',
        gameOver: 'game-over',
        
        // Contenedores
        gameContainer: 'game-container',
        notificationArea: 'notification-area',
        
        // Botones
        startBtn: 'start-btn',
        slotBtn: 'slot-btn',
        restartBtn: 'restart-btn',
        shareBtn: 'share-btn',
        audioToggle: 'audio-toggle',
        
        // Reels
        reels: ['reel-0', 'reel-1', 'reel-2', 'reel-3'],
        
        // HUD
        score: 'score',
        wave: 'wave',
        livesContainer: 'lives-container',
        progressFill: 'progress-fill',
        progressText: 'progress-text',
        
        // Bonus
        bonusSpins: 'bonus-spins',
        bonusProgressText: 'bonus-progress-text',
        bonusProgressFill: 'bonus-progress-fill',
        
        // Game Over
        finalScore: 'final-score',
        finalWave: 'final-wave',
        finalGems: 'final-gems',
        
        // Cofre
        chest: 'chest'
    };
    
    // Cachear elementos individuales
    for (const [key, id] of Object.entries(elements)) {
        if (Array.isArray(id)) {
            state.dom[key] = id.map(i => document.getElementById(i));
        } else {
            state.dom[key] = document.getElementById(id);
        }
    }
    
    console.log('✅ DOM cacheado');
}

/**
 * Inicializa el contexto de audio (requiere interacción de usuario)
 */
function initAudio() {
    if (state.audioContext) return;
    
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            state.audioContext = new AudioContext();
            console.log('✅ Audio inicializado');
        }
    } catch (e) {
        console.warn('⚠️ Audio no disponible:', e);
        state.isMuted = true;
    }
}

/**
 * Reproduce un tono simple
 */
function playTone(frequency, duration = 200, type = 'sine') {
    if (state.isMuted || !state.audioContext) return;
    
    try {
        const osc = state.audioContext.createOscillator();
        const gain = state.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(state.audioContext.destination);
        
        osc.frequency.value = frequency;
        osc.type = type;
        
        gain.gain.setValueAtTime(0.3, state.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, state.audioContext.currentTime + duration / 1000);
        
        osc.start(state.audioContext.currentTime);
        osc.stop(state.audioContext.currentTime + duration / 1000);
    } catch (e) {
        console.warn('Error de audio:', e);
    }
}

// ============ FUNCIONES DEL JUEGO ============

/**
 * Inicializa el juego completo
 */
function initGame() {
    console.log('🎮 Iniciando Battle of Glory...');
    
    // Resetear estado
    state.isPlaying = true;
    state.isBonusMode = false;
    state.isSpinning = false;
    state.score = 0;
    state.wave = 1;
    state.progress = 0;
    state.lives = CONFIG.GAME.initialLives;
    state.bonusSpins = 0;
    state.totalGems = 0;
    
    // Actualizar UI
    updateUI();
    updateLives();
    updateProgress();
    
    // Cambiar pantallas
    showScreen('slotArea');
    
    // Generar gemas iniciales
    generateInitialGems();
    
    // Habilitar botón de spin
    if (state.dom.slotBtn) {
        state.dom.slotBtn.disabled = false;
    }
    
    playTone(CONFIG.AUDIO.bonus, 400);
    console.log('✅ Juego iniciado');
}

/**
 * Muestra una pantalla específica
 */
function showScreen(screenName) {
    // Ocultar todas
    ['startScreen', 'slotArea', 'bonusScreen', 'gameOver'].forEach(screen => {
        if (state.dom[screen]) {
            state.dom[screen].style.display = 'none';
            state.dom[screen].classList.remove('active');
        }
    });
    
    // Mostrar la solicitada
    const target = state.dom[screenName];
    if (target) {
        target.style.display = screenName === 'slotArea' ? 'flex' : 'block';
        target.classList.add('active');
    }
}

/**
 * Genera gemas iniciales en los reels
 */
function generateInitialGems() {
    state.dom.reels.forEach((reel, index) => {
        if (!reel) return;
        
        reel.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const gemType = getRandomGem();
            const gem = createGemElement(gemType);
            reel.appendChild(gem);
        }
    });
}

/**
 * Obtiene una gema aleatoria basada en pesos
 */
function getRandomGem() {
    const rand = Math.random() * 100;
    let cumulative = 0;
    
    for (const [type, config] of Object.entries(CONFIG.GEMS)) {
        cumulative += config.weight;
        if (rand <= cumulative) {
            return type;
        }
    }
    
    return 'red';
}

/**
 * Crea elemento DOM para una gema
 */
function createGemElement(type) {
    const config = CONFIG.GEMS[type];
    const div = document.createElement('div');
    
    div.className = `slot-gem ${type}`;
    div.dataset.type = type;
    div.innerHTML = `
        <span class="gem-icon">${config.icon}</span>
        <span class="gem-value">${config.value}</span>
    `;
    div.style.borderColor = config.color;
    
    return div;
}

/**
 * Gira los slots
 */
function spinSlots() {
    // Validaciones
    if (state.isSpinning || !state.isPlaying) return;
    
    // Modo bonus - verificar spins restantes
    if (state.isBonusMode) {
        state.bonusSpins--;
        if (state.bonusSpins < 0) {
            endGame();
            return;
        }
        updateBonusUI();
    }
    
    // Iniciar spin
    state.isSpinning = true;
    if (state.dom.slotBtn) {
        state.dom.slotBtn.disabled = true;
        state.dom.slotBtn.classList.add('spinning');
    }
    
    // Cerrar cofre si está abierto
    if (state.dom.chest) {
        state.dom.chest.classList.remove('open', 'glowing');
    }
    
    playTone(CONFIG.AUDIO.spin, 600, 'square');
    
    // Animar cada reel con delay
    state.dom.reels.forEach((reel, index) => {
        if (reel) {
            setTimeout(() => animateReel(reel, index), index * 200);
        }
    });
    
    // Finalizar después de la duración total
    setTimeout(finishSpin, CONFIG.GAME.spinDuration);
}

/**
 * Animación individual de un reel
 */
function animateReel(reelElement, reelIndex) {
    let steps = 0;
    const maxSteps = 20 + (reelIndex * 5); // Cada reel gira más tiempo
    
    const interval = setInterval(() => {
        reelElement.innerHTML = '';
        
        // Crear gemas temporales con efecto de movimiento
        for (let i = 0; i < 5; i++) {
            const tempGem = createGemElement(getRandomGem());
            tempGem.style.opacity = i === 2 ? '1' : '0.3';
            tempGem.style.transform = `scale(${i === 2 ? 1.2 : 0.8})`;
            reelElement.appendChild(tempGem);
        }
        
        steps++;
        if (steps >= maxSteps) {
            clearInterval(interval);
        }
    }, 100);
}

/**
 * Finaliza el spin y calcula resultados
 */
function finishSpin() {
    let totalPoints = 0;
    const results = [];
    
    // Generar resultado final para cada reel
    state.dom.reels.forEach((reel, index) => {
        if (!reel) return;
        
        const result = getReelResult();
        results.push(result);
        
        // Mostrar gemas finales
        reel.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const isCenter = i === 2;
            const gemType = isCenter ? result.type : getRandomGem();
            const gem = createGemElement(gemType);
            
            if (isCenter) {
                gem.classList.add('winning');
                gem.style.transform = 'scale(1.3)';
                gem.style.boxShadow = `0 0 20px ${CONFIG.GEMS[result.type].color}`;
            }
            
            reel.appendChild(gem);
        }
        
        // Puntos del centro
        if (index === 1 || index === 2) { // Reels 1 y 2 dan puntos
            totalPoints += result.value;
            showFloatingPoints(result.value, reel, CONFIG.GEMS[result.type].color);
        }
    });
    
    // Actualizar score
    state.score += totalPoints;
    state.totalGems += results.length;
    
    // Verificar victoria (gemas doradas)
    const hasGold = results.some(r => r.type === 'gold');
    
    if (hasGold) {
        playTone(CONFIG.AUDIO.win, 500, 'sine');
        showNotification('¡GEMA DE ORO! +20', 'gold');
    }
    
    // Actualizar progreso
    if (!state.isBonusMode) {
        state.progress += totalPoints;
        
        // Verificar cofre
        if (state.progress >= CONFIG.GAME.chestThreshold) {
            state.progress = 0;
            openChest();
        }
        
        // Perder vida si no hay oro (30% probabilidad)
        if (!hasGold && Math.random() < 0.3) {
            loseLife();
        }
    } else {
        state.progress += totalPoints;
        if (state.progress >= CONFIG.GAME.chestThreshold) {
            state.progress = 0;
            openChest();
        }
    }
    
    // Actualizar UI
    updateUI();
    updateProgress();
    
    // Reactivar botón
    state.isSpinning = false;
    if (state.dom.slotBtn) {
        state.dom.slotBtn.disabled = false;
        state.dom.slotBtn.classList.remove('spinning');
    }
}

/**
 * Obtiene resultado ponderado para un reel
 */
function getReelResult() {
    const type = getRandomGem();
    return {
        type: type,
        value: CONFIG.GEMS[type].value
    };
}

/**
 * Abre el cofre de bonus
 */
function openChest() {
    if (!state.dom.chest) return;
    
    state.dom.chest.classList.add('open', 'glowing');
    
    const bonusPoints = state.isBonusMode ? 100 : 50;
    state.score += bonusPoints;
    
    playTone(CONFIG.AUDIO.chest, 800, 'sine');
    showFloatingPoints(bonusPoints, state.dom.chest, '#ffd700');
    showNotification('¡COFRE ABIERTO! +' + bonusPoints, 'chest');
    
    setTimeout(() => {
        state.dom.chest.classList.remove('open', 'glowing');
    }, 2000);
    
    updateUI();
}

/**
 * Pierde una vida
 */
function loseLife() {
    state.lives--;
    updateLives();
    
    playTone(CONFIG.AUDIO.lose, 300, 'sawtooth');
    
    // Efecto visual de daño
    document.body.classList.add('damage-effect');
    setTimeout(() => document.body.classList.remove('damage-effect'), 300);
    
    if (state.lives <= 0) {
        setTimeout(enterBonusMode, 500);
    }
}

/**
 * Entra en modo bonus
 */
function enterBonusMode() {
    state.isBonusMode = true;
    state.bonusSpins = CONFIG.GAME.bonusSpins;
    state.progress = 0;
    state.lives = CONFIG.GAME.initialLives;
    
    showScreen('bonusScreen');
    updateBonusUI();
    
    playTone(CONFIG.AUDIO.bonus, 1000, 'sine');
    showNotification('🎰 ¡MODO BONUS ACTIVADO! 🎰', 'bonus');
    
    console.log('Modo bonus activado:', state.bonusSpins, 'spins');
}

/**
 * Finaliza el juego
 */
function endGame() {
    state.isPlaying = false;
    state.isBonusMode = false;
    
    // Actualizar pantalla de game over
    if (state.dom.finalScore) state.dom.finalScore.textContent = state.score;
    if (state.dom.finalWave) state.dom.finalWave.textContent = state.wave;
    if (state.dom.finalGems) state.dom.finalGems.textContent = state.totalGems;
    
    showScreen('gameOver');
    
    // Guardar high score
    const highScore = localStorage.getItem('bog-highscore') || 0;
    if (state.score > highScore) {
        localStorage.setItem('bog-highscore', state.score);
        showNotification('🏆 ¡NUEVO RÉCORD! 🏆', 'record');
    }
}

// ============ UI UPDATES ============

function updateUI() {
    if (state.dom.score) state.dom.score.textContent = state.score.toLocaleString();
    if (state.dom.wave) state.dom.wave.textContent = state.wave;
}

function updateLives() {
    if (!state.dom.livesContainer) return;
    
    const skulls = state.dom.livesContainer.querySelectorAll('.skull');
    skulls.forEach((skull, index) => {
        if (index < state.lives) {
            skull.classList.add('active');
            skull.classList.remove('lost');
            skull.textContent = '💀';
        } else {
            skull.classList.remove('active');
            skull.classList.add('lost');
            skull.textContent = '💨';
        }
    });
}

function updateProgress() {
    if (state.dom.progressFill) {
        const pct = Math.min(100, (state.progress / CONFIG.GAME.chestThreshold) * 100);
        state.dom.progressFill.style.width = pct + '%';
    }
    if (state.dom.progressText) {
        state.dom.progressText.textContent = `${state.progress} / ${CONFIG.GAME.chestThreshold}`;
    }
}

function updateBonusUI() {
    if (state.dom.bonusSpins) {
        state.dom.bonusSpins.textContent = state.bonusSpins;
    }
    if (state.dom.bonusProgressText) {
        state.dom.bonusProgressText.textContent = `${state.progress} / ${CONFIG.GAME.chestThreshold}`;
    }
    if (state.dom.bonusProgressFill) {
        const pct = Math.min(100, (state.progress / CONFIG.GAME.chestThreshold) * 100);
        state.dom.bonusProgressFill.style.width = pct + '%';
    }
}

// ============ EFECTOS VISUALES ============

function showFloatingPoints(points, element, color = '#fff') {
    if (!element || !state.dom.gameContainer) return;
    
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = '+' + points;
    popup.style.color = color;
    popup.style.textShadow = `0 0 10px ${color}`;
    
    const rect = element.getBoundingClientRect();
    const containerRect = state.dom.gameContainer.getBoundingClientRect();
    
    popup.style.left = (rect.left - containerRect.left + rect.width / 2) + 'px';
    popup.style.top = (rect.top - containerRect.top) + 'px';
    
    state.dom.gameContainer.appendChild(popup);
    
    // Animación
    requestAnimationFrame(() => {
        popup.style.transform = 'translateY(-100px) scale(1.5)';
        popup.style.opacity = '0';
    });
    
    setTimeout(() => popup.remove(), 1000);
}

function showNotification(text, type = 'info') {
    if (!state.dom.notificationArea) return;
    
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = text;
    
    state.dom.notificationArea.appendChild(notif);
    
    setTimeout(() => {
        notif.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

// ============ EVENT HANDLERS ============

function handleStart() {
    initAudio();
    initGame();
}

function handleRestart() {
    initGame();
}

function handleShare() {
    const text = `¡Obtuve ${state.score} puntos en Battle of Glory! ¿Puedes superarme?`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Battle of Glory',
            text: text,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(text + ' ' + window.location.href);
        showNotification('📋 Copiado al portapapeles', 'info');
    }
}

function toggleAudio() {
    state.isMuted = !state.isMuted;
    const btn = state.dom.audioToggle;
    if (btn) {
        btn.textContent = state.isMuted ? '🔇' : '🔊';
    }
    showNotification(state.isMuted ? 'Audio desactivado' : 'Audio activado', 'info');
}

function handleKeydown(e) {
    if (!state.isPlaying) return;
    
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            if (!state.isSpinning) spinSlots();
            break;
        case 'KeyR':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                handleRestart();
            }
            break;
        case 'KeyM':
            toggleAudio();
            break;
    }
}

// ============ SETUP INICIAL ============

function setupEventListeners() {
    // Botones principales
    if (state.dom.startBtn) {
        state.dom.startBtn.addEventListener('click', handleStart);
    }
    
    if (state.dom.slotBtn) {
        state.dom.slotBtn.addEventListener('click', spinSlots);
    }
    
    if (state.dom.restartBtn) {
        state.dom.restartBtn.addEventListener('click', handleRestart);
    }
    
    if (state.dom.shareBtn) {
        state.dom.shareBtn.addEventListener('click', handleShare);
    }
    
    if (state.dom.audioToggle) {
        state.dom.audioToggle.addEventListener('click', toggleAudio);
    }
    
    // Teclado
    document.addEventListener('keydown', handleKeydown);
    
    // Prevenir comportamientos por defecto problemáticos
    document.addEventListener('touchmove', (e) => {
        if (e.scale !== 1) e.preventDefault();
    }, { passive: false });
    
    // Prevenir menú contextual en botones de juego
    ['startBtn', 'slotBtn', 'restartBtn'].forEach(id => {
        const btn = state.dom[id];
        if (btn) {
            btn.addEventListener('contextmenu', e => e.preventDefault());
        }
    });
}

/**
 * Registra Service Worker para PWA
 */
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ Service Worker registrado'))
            .catch(err => console.warn('⚠️ SW error:', err));
    }
}

// ============ INICIO ============

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Battle of Glory v1.0 cargando...');
    
    // 1. Cachear DOM
    cacheDOM();
    
    // 2. Configurar eventos
    setupEventListeners();
    
    // 3. Registrar SW
    registerSW();
    
    // 4. Cargar high score
    const highScore = localStorage.getItem('bog-highscore') || 0;
    console.log('🏆 High Score guardado:', highScore);
    
    console.log('✅ Juego listo - Presiona INICIAR BATALLA');
} 
    
   
);// Añadir al estado
const state = {
    // ... estado actual ...
    mode: 'single', // 'single' | 'local'
    currentPlayer: 1,
    players: {
        1: { score: 0, lives: 3, name: 'Jugador 1' },
        2: { score: 0, lives: 3, name: 'Jugador 2' }
    }
};

// Nueva función: seleccionar modo
function selectGameMode(mode) {
    state.mode = mode;
    
    if (mode === 'local') {
        // Resetear ambos jugadores
        state.players[1] = { score: 0, lives: 3, name: 'Jugador 1' };
        state.players[2] = { score: 0, lives: 3, name: 'Jugador 2' };
        state.currentPlayer = 1;
        showScreen('characterSelect'); // Nueva pantalla
    } else {
        initGame();
    }
}

// Cambiar turno después de cada spin
function nextTurn() {
    if (state.mode === 'local') {
        // Verificar si el jugador actual perdió
        if (state.lives <= 0) {
            eliminatePlayer(state.currentPlayer);
            return;
        }
        
        // Guardar estado del jugador actual
        state.players[state.currentPlayer].score = state.score;
        state.players[state.currentPlayer].lives = state.lives;
        
        // Cambiar jugador
        state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
        
        // Cargar estado del nuevo jugador
        state.score = state.players[state.currentPlayer].score;
        state.lives = state.players[state.currentPlayer].lives;
        
        updatePlayerIndicator();
        showNotification(`Turno de ${state.players[state.currentPlayer].name}`, 'info');
    }
}

// Modificar finishSpin() para llamar nextTurn()
function finishSpin() {
    // ... código actual ...
    
    // Al final, cambiar turno si es modo local
    if (state.mode === 'local' && !state.isBonusMode) {
        setTimeout(nextTurn, 1500);
    }
}

