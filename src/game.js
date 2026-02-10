const dino = document.getElementById('dino');
const obstacle = document.getElementById('obstacle');
const gameArea = document.getElementById('game-area');
const scoreDisplay = document.getElementById('score');
const titleScreen = document.getElementById('title-screen');
const gameContainer = document.getElementById('game-container');
const highScoreDisplay = document.getElementById('high-score-display');
const leaderboardList = document.getElementById('leaderboard-list');
const backToMenuBtn = document.getElementById('back-to-menu');
const milestonePopup = document.getElementById('milestone-popup');

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function generateJumpSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
}

function generateMilestoneSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
}

function generateGameOverSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(55, audioContext.currentTime + 0.5);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
}

let isJumping = false;
let isGameOver = false;
let isInGame = false;
let score = 0;
let lastMilestone = 0;
let jumpCount = 0;

let gameLoopId = null;
let lastTimestamp = 0;
let scoreUpdateAccumulator = 0;
const SCORE_INTERVAL_MS = 100;


const milestoneMessages = {
    100: "You're getting started!",
    200: "You're on fire!",
    300: "Incredible progress!",
    400: "You're unstoppable!",
    500: "Legendary performance!",
    600: "You're a dino master!",
    700: "Absolutely amazing!",
    800: "You're breaking records!",
    900: "Almost to 1000!",
    1000: "You're a true champion!"
};

let highScore = 0;
let leaderboard = [];

const obstacleTypes = [
    {
        name: "cactus_small_single",
        width: 20, height: 40,
        svg: `<svg width="20" height="40" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="0" width="4" height="40" fill="#2E7D32"/>
            <rect x="2" y="10" width="6" height="4" fill="#388E3C"/>
            <rect x="2" y="14" width="4" height="8" fill="#2E7D32"/>
            <rect x="12" y="15" width="6" height="4" fill="#388E3C"/>
            <rect x="14" y="19" width="4" height="8" fill="#2E7D32"/>
        </svg>`
    },
    {
        name: "cactus_tall_slim",
        width: 25, height: 55,
        svg: `<svg width="25" height="55" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="0" width="5" height="55" fill="#1B5E20"/>
            <rect x="2" y="20" width="8" height="5" fill="#2E7D32"/>
            <rect x="2" y="25" width="5" height="10" fill="#1B5E20"/>
            <rect x="15" y="30" width="8" height="5" fill="#2E7D32"/>
            <rect x="18" y="35" width="5" height="12" fill="#1B5E20"/>
        </svg>`
    },
    {
        name: "cactus_wide_short",
        width: 45, height: 30,
        svg: `<svg width="45" height="30" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="0" width="5" height="30" fill="#2E7D32"/>
            <rect x="5" y="5" width="15" height="5" fill="#388E3C"/>
            <rect x="5" y="10" width="5" height="15" fill="#2E7D32"/>
            <rect x="25" y="5" width="15" height="5" fill="#388E3C"/>
            <rect x="35" y="10" width="5" height="15" fill="#2E7D32"/>
        </svg>`
    },
    {
        name: "cactus_double_short",
        width: 50, height: 35,
        svg: `<svg width="50" height="35" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="0" width="4" height="35" fill="#1B5E20"/>
            <rect x="2" y="8" width="6" height="3" fill="#2E7D32"/>
            <rect x="2" y="11" width="4" height="7" fill="#1B5E20"/>
            <rect x="38" y="0" width="4" height="35" fill="#1B5E20"/>
            <rect x="42" y="12" width="6" height="3" fill="#2E7D32"/>
            <rect x="44" y="15" width="4" height="7" fill="#1B5E20"/>
        </svg>`
    }
];

let currentObstacleProps = null;

function jump() {
    if (isJumping || isGameOver) return;
    isJumping = true;
    jumpCount++;

    if (jumpCount === 50 && !achievements['jump_master'].unlocked) {
        unlockAchievement('jump_master');
    }

    dino.classList.add('jump');
    generateJumpSound();
    setTimeout(() => {
        dino.classList.remove('jump');
        isJumping = false;
    }, 500);
}

document.addEventListener('keydown', function (event) {
    if (event.code === 'Space') {
        event.preventDefault();

        if (isGameOver) {
            startGame();
        } else if (isInGame) {
            jump();
        }
    }
});

backToMenuBtn.addEventListener('click', function () {
    showTitleScreen();
});

function showTitleScreen() {
    const titleScreen = document.getElementById('title-screen');
    const gameContainer = document.getElementById('game-container');

    if (titleScreen) {
        titleScreen.style.display = 'block';
    }

    if (gameContainer) {
        gameContainer.style.display = 'none';
    }
    isInGame = false;
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    requestAnimationFrame(() => {
        updateLeaderboardDisplay();
    });
}

function showGame() {
    isInGame = true;
    titleScreen.style.display = 'none';
    gameContainer.style.display = 'block';
}

function updateHighScoreDisplay() {
    highScoreDisplay.textContent = `High Score: ${highScore}`;
}

function updateLeaderboardDisplay() {
    const leaderboardElement = document.getElementById('leaderboard-list');
    const modalLeaderboardList = document.getElementById('modal-leaderboard-list');

    function generateLeaderboardHTML(scores) {
        if (!scores || scores.length === 0) {
            return '<div class="score-entry">No scores yet - be the first!</div>';
        }
        return scores
            .slice(0, 10)
            .map((score, index) => {
                const rank = index + 1;
                const medals = ['🥇', '🥈', '🥉'];
                const medal = medals[index] || `${rank}.`;
                return `
                    <div class="score-entry">
                        <span class="score-rank">${medal}</span>
                        <span class="score-value">${score}</span>
                    </div>
                `;
            })
            .join('');
    }

    if (leaderboardElement) {
        leaderboardElement.innerHTML = generateLeaderboardHTML(leaderboard);
    }

    if (modalLeaderboardList) {
        modalLeaderboardList.innerHTML = generateLeaderboardHTML(leaderboard);
    }
    updateHighScoreDisplay();
}

function addToLeaderboard(newScore) {
    leaderboard.push(newScore);
    leaderboard.sort((a, b) => b - a);
    leaderboard = leaderboard.slice(0, 10);
    if (newScore > highScore) {
        highScore = newScore;
        updateHighScoreDisplay();
    }
    saveGameProgress();
}

function spawnNewObstacle() {
    const randomIndex = Math.floor(Math.random() * obstacleTypes.length);
    currentObstacleProps = obstacleTypes[randomIndex];

    if (!currentObstacleProps || typeof currentObstacleProps.width === 'undefined' || typeof currentObstacleProps.svg === 'undefined') {
        return;
    }

    obstacle.style.animation = 'none';
    obstacle.style.right = `-100px`;

    obstacle.style.width = `${currentObstacleProps.width}px`;
    obstacle.style.height = `${currentObstacleProps.height}px`;

    const svgDataUrl = 'data:image/svg+xml,' + encodeURIComponent(currentObstacleProps.svg);
    obstacle.style.backgroundImage = `url("${svgDataUrl}")`;
    obstacle.style.backgroundSize = 'contain';
    obstacle.style.backgroundRepeat = 'no-repeat';

    obstacle.offsetHeight;

    obstacle.style.animation = 'obstacle-move 2s linear infinite';
    obstacle.style.animationPlayState = 'running';
}

function checkGameLogic() {
    if (isGameOver) return;

    const dinoRect = dino.getBoundingClientRect();
    const obstacleRect = obstacle.getBoundingClientRect();

    const horizontalBuffer = 5;
    const verticalBuffer = 5;

    const horizontalOverlap = dinoRect.right - horizontalBuffer > obstacleRect.left &&
        dinoRect.left + horizontalBuffer < obstacleRect.right;
    const verticalOverlap = dinoRect.bottom - verticalBuffer > obstacleRect.top &&
        dinoRect.top + verticalBuffer < obstacleRect.bottom;

    if (horizontalOverlap && verticalOverlap) {
        gameOver();
        return;
    }

    const gameAreaRect = gameArea.getBoundingClientRect();
    if (obstacleRect.right < gameAreaRect.left && currentObstacleProps) {
        spawnNewObstacle();
    }
}

function showMilestonePopup(points) {
    if (isGameOver) return;

    const message = milestoneMessages[points] || "Keep going!";
    const scoreElement = milestonePopup.querySelector('.milestone-score');
    const messageElement = milestonePopup.querySelector('.milestone-message');

    scoreElement.textContent = `🎉 ${points} POINTS! 🎉`;
    messageElement.textContent = message;

    generateMilestoneSound();

    milestonePopup.classList.remove('animate');
    milestonePopup.offsetHeight;
    milestonePopup.classList.add('animate');

    setTimeout(() => {
        if (!isGameOver) {
            milestonePopup.classList.remove('animate');
        }
    }, 2000);
}

function _incrementScoreAndUpdateDisplay() {
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
}

function _checkAndUpdateHighScore() {
    if (score > highScore) {
        highScore = score;
        updateHighScoreDisplay();
    }
}

function _checkScoreBasedAchievements() {
    if (score === 100 && achievements['score_100'] && !achievements['score_100'].unlocked) {
        unlockAchievement('score_100');
    } else if (score === 500 && achievements['score_500'] && !achievements['score_500'].unlocked) {
        unlockAchievement('score_500');
    } else if (score === 1000 && achievements['score_1000'] && !achievements['score_1000'].unlocked) {
        unlockAchievement('score_1000');
    }
}

function _checkMilestones() {
    if (score % 100 === 0 && score > lastMilestone && !isGameOver) {
        lastMilestone = score;
        showMilestonePopup(score);
    }
}

function _updateDayNightCycle() {
    updateDayNightCycle(score);
}


function gameOver() {
    if (isGameOver) return;
    isGameOver = true;
    isInGame = false;

    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    if (obstacle) {
        obstacle.style.animationPlayState = 'paused';
    }

    unlockAchievement('first_death');

    generateGameOverSound();

    const gameOverlay = document.getElementById('game-overlay');
    const gameOverText = gameOverlay.querySelector('.game-over-text');
    const gameOverScore = gameOverlay.querySelector('.game-over-score');
    const gameOverMessage = gameOverlay.querySelector('.game-over-message');

    if (score > 0) {
        addToLeaderboard(score);

        let message = 'Press SPACE to play again';
        if (score === highScore && score > 0) {
            message = '🎉 NEW HIGH SCORE! Press SPACE to play again';
            gameOverText.textContent = 'NEW HIGH SCORE!';
        } else if (leaderboard.indexOf(score) < 3 && leaderboard.length > 1) {
            message = '🏆 TOP 3 SCORE! Press SPACE to play again';
            gameOverText.textContent = 'TOP 3 SCORE!';
        } else {
            gameOverText.textContent = 'GAME OVER';
        }

        gameOverScore.textContent = `Score: ${score}`;
        gameOverMessage.textContent = message;
    } else {
        gameOverText.textContent = 'GAME OVER';
        gameOverScore.textContent = 'Score: 0';
        gameOverMessage.textContent = 'Press SPACE to play again';
    }

    gameOverlay.classList.add('show');
    backToMenuBtn.style.display = 'inline-block';
}

function gameLoop(timestamp) {
    if (isGameOver || !isInGame) {
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
        return;
    }

    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    checkGameLogic();

    scoreUpdateAccumulator += deltaTime;
    if (scoreUpdateAccumulator >= SCORE_INTERVAL_MS) {
        _incrementScoreAndUpdateDisplay();
        _checkAndUpdateHighScore();
        _checkScoreBasedAchievements();
        _checkMilestones();
        _updateDayNightCycle();
        scoreUpdateAccumulator -= SCORE_INTERVAL_MS;
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}


function startGame() {
    titleScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    isInGame = true;
    isGameOver = false;
    isJumping = false;
    score = 0;
    jumpCount = 0;
    lastMilestone = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    backToMenuBtn.style.display = 'none';

    document.getElementById('game-overlay').classList.remove('show');
    document.getElementById('milestone-popup').classList.remove('animate');

    dino.classList.remove('jump');
    dino.style.bottom = '30px';

    spawnNewObstacle();

    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
    }
    lastTimestamp = performance.now();
    scoreUpdateAccumulator = 0;
    gameLoopId = requestAnimationFrame(gameLoop);
}

showTitleScreen();

const characterTypes = {
    default: {
        name: "Classic Dino",
        unlocked: true,
        svg: `<svg width="40" height="50" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="20" width="5" height="5" fill="#228B22"/>
            <rect x="5" y="25" width="5" height="5" fill="#228B22"/>
            <rect x="5" y="15" width="20" height="15" fill="#228B22"/>
            <rect x="10" y="30" width="5" height="20" fill="#228B22"/>
            <rect x="20" y="30" width="5" height="20" fill="#228B22"/>
            <rect x="25" y="10" width="5" height="10" fill="#228B22"/>
            <rect x="25" y="0" width="15" height="10" fill="#228B22"/>
            <rect x="35" y="2" width="3" height="3" fill="#FFF"/>
            <rect x="38" y="6" width="2" height="2" fill="#000"/>
        </svg>`
    },
    raptor: {
        name: "Raptor",
        unlocked: false,
        requirement: "score_500",
        svg: `<svg width="40" height="50" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="20" width="5" height="5" fill="#8B4513"/>
            <rect x="5" y="25" width="5" height="5" fill="#8B4513"/>
            <rect x="5" y="15" width="20" height="15" fill="#8B4513"/>
            <rect x="10" y="30" width="5" height="20" fill="#8B4513"/>
            <rect x="20" y="30" width="5" height="20" fill="#8B4513"/>
            <rect x="25" y="10" width="5" height="10" fill="#8B4513"/>
            <rect x="25" y="0" width="15" height="10" fill="#8B4513"/>
            <rect x="35" y="2" width="3" height="3" fill="#FF0000"/>
            <rect x="38" y="6" width="2" height="2" fill="#000"/>
        </svg>`
    },
    robot: {
        name: "Robot Dino",
        unlocked: false,
        requirement: "achievement_5",
        svg: `<svg width="40" height="50" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="20" width="5" height="5" fill="#808080"/>
            <rect x="5" y="25" width="5" height="5" fill="#808080"/>
            <rect x="5" y="15" width="20" height="15" fill="#808080"/>
            <rect x="10" y="30" width="5" height="20" fill="#808080"/>
            <rect x="20" y="30" width="5" height="20" fill="#808080"/>
            <rect x="25" y="10" width="5" height="10" fill="#808080"/>
            <rect x="25" y="0" width="15" height="10" fill="#808080"/>
            <rect x="35" y="2" width="3" height="3" fill="#00FF00"/>
            <rect x="38" y="6" width="2" height="2" fill="#000"/>
        </svg>`
    }
};

const achievements = {
    score_100: {
        id: "score_100",
        name: "Getting Started",
        description: "Reach 100 points",
        unlocked: false,
        icon: "🎯"
    },
    score_500: {
        id: "score_500",
        name: "Dino Master",
        description: "Reach 500 points",
        unlocked: false,
        icon: "🏆"
    },
    score_1000: {
        id: "score_1000",
        name: "Dino Legend",
        description: "Reach 1000 points",
        unlocked: false,
        icon: "👑"
    },
    first_death: {
        id: "first_death",
        name: "First Fall",
        description: "Experience your first game over",
        unlocked: false,
        icon: "💀"
    },
    jump_master: {
        id: "jump_master",
        name: "Jump Master",
        description: "Jump 50 times in one game",
        unlocked: false,
        icon: "🦘"
    }
};

let currentCharacter = 'default';
let unlockedAchievements = new Set();

function unlockAchievement(achievementId) {
    if (!achievements[achievementId] || achievements[achievementId].unlocked) {
        return;
    }
    achievements[achievementId].unlocked = true;
    unlockedAchievements.add(achievementId);

    let aCharWasUnlocked = false;
    Object.entries(characterTypes).forEach(([charId, char]) => {
        if (!char.unlocked && char.requirement) {
            let shouldUnlock = false;
            if (char.requirement.startsWith('score_')) {
                const requiredScore = parseInt(char.requirement.split('_')[1]);
                if (score >= requiredScore) { shouldUnlock = true; }
            } else if (char.requirement.startsWith('achievement_')) {
                const requiredCount = parseInt(char.requirement.split('_')[1]);
                const unlockedCount = Object.values(achievements).filter(a => a.unlocked).length;
                if (unlockedCount >= requiredCount) { shouldUnlock = true; }
            } else if (char.requirement === achievementId) { shouldUnlock = true; }

            if (shouldUnlock) {
                char.unlocked = true;
                showCharacterUnlockPopup(charId);
                aCharWasUnlocked = true;
            }
        }
    });

    const ach = achievements[achievementId];
    if (aCharWasUnlocked) {
        setTimeout(() => { showAchievementPopup(achievementId, ach.name, ach.description); }, 3500);
    } else {
        showAchievementPopup(achievementId, ach.name, ach.description);
    }
    saveGameProgress();
    initializeCharacterSelect();
}


function showCharacterUnlockPopup(characterId) {
    const character = characterTypes[characterId];
    const popup = document.getElementById('character-unlock-popup');
    const icon = popup.querySelector('.character-icon');
    icon.style.backgroundImage = `url('data:image/svg+xml,${encodeURIComponent(character.svg)}')`;
    popup.querySelector('.character-name').textContent = character.name;
    popup.classList.add('show');

    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

function selectCharacter(characterId) {
    if (!characterTypes[characterId]) {
        return;
    }
    if (!characterTypes[characterId].unlocked) {
        return;
    }

    document.querySelectorAll('.character-option').forEach(option => {
        option.classList.remove('selected');
    });
    const selectedOption = document.querySelector(`.character-option[data-character-id="${characterId}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }

    currentCharacter = characterId;
    const character = characterTypes[characterId];
    const svgDataUrl = 'data:image/svg+xml,' + encodeURIComponent(character.svg);
    const dino = document.getElementById('dino');
    if (dino) {
        dino.style.backgroundImage = `url("${svgDataUrl}")`;
    }
    updateStartButton();
    saveGameProgress();
}

function updateStartButton() {
    const startGameBtn = document.getElementById('start-game');
    if (startGameBtn) {
        if (currentCharacter) {
            startGameBtn.style.display = 'inline-block';
            startGameBtn.disabled = false;
            startGameBtn.textContent = 'Click to Start!';
        } else {
            startGameBtn.style.display = 'none';
        }
    }
}

function saveGameProgress() {
    try {
        const progress = {
            currentCharacter: currentCharacter,
            achievements: Object.fromEntries(
                Object.entries(achievements).map(([id, achievement]) => [id, achievement.unlocked])
            ),
            leaderboard: leaderboard,
            highScore: typeof highScore !== 'undefined' ? highScore : 0,
            characters: Object.fromEntries(
                Object.entries(characterTypes).map(([id, char]) => [id, char.unlocked])
            )
        };
        localStorage.setItem('dinoGameProgress', JSON.stringify(progress));
    } catch (error) {
        // error saving
    }
}

function loadGameProgress() {
    try {
        const savedProgress = localStorage.getItem('dinoGameProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);

            if (progress.achievements) {
                Object.entries(progress.achievements).forEach(([id, unlocked]) => {
                    if (achievements[id]) {
                        achievements[id].unlocked = unlocked;
                        if (unlocked) unlockedAchievements.add(id);
                    }
                });
            }

            if (progress.currentCharacter && characterTypes[progress.currentCharacter]) {
                currentCharacter = progress.currentCharacter;
                const character = characterTypes[currentCharacter];
                const svgDataUrl = 'data:image/svg+xml,' + encodeURIComponent(character.svg);
                const dino = document.getElementById('dino');
                if (dino) {
                    dino.style.backgroundImage = `url("${svgDataUrl}")`;
                }
            }

            if (progress.leaderboard) {
                leaderboard = progress.leaderboard;
            }

            if (typeof progress.highScore !== 'undefined') {
                highScore = progress.highScore;
                updateHighScoreDisplay();
            }

            if (progress.characters) {
                Object.entries(progress.characters).forEach(([id, unlocked]) => {
                    if (characterTypes[id]) {
                        characterTypes[id].unlocked = unlocked;
                    }
                });
            }
        }
    } catch (error) {
        // error loading
    }
}

function initializeAchievements() {
    const achievementsBtn = document.getElementById('achievements-btn');
    if (achievementsBtn) {
        achievementsBtn.replaceWith(achievementsBtn.cloneNode(true));
        const newAchievementsBtn = document.getElementById('achievements-btn');

        newAchievementsBtn.addEventListener('click', function () {
            const modal = document.getElementById('achievements-modal');
            const achievementsList = document.getElementById('achievements-list');
            if (modal && achievementsList) {
                const achievementsHTML = Object.values(achievements)
                    .map(achievement => `
                        <div class="achievement-item ${achievement.unlocked ? 'unlocked' : ''}">
                            <div class="achievement-icon">${achievement.icon}</div>
                            <div class="achievement-info">
                                <div class="achievement-name">${achievement.name}</div>
                                <div class="achievement-description">${achievement.description}</div>
                            </div>
                        </div>
                    `).join('');

                achievementsList.innerHTML = achievementsHTML;
                modal.style.display = 'block';
            }
        });
    }
}

function initializeLeaderboard() {
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) {
        leaderboardBtn.replaceWith(leaderboardBtn.cloneNode(true));
        const newLeaderboardBtn = document.getElementById('leaderboard-btn');

        newLeaderboardBtn.addEventListener('click', function () {
            const modal = document.getElementById('leaderboard-modal');
            const leaderboardList = document.getElementById('modal-leaderboard-list');
            if (modal && leaderboardList) {
                updateLeaderboardDisplay();
                modal.style.display = 'block';
            }
        });
    }
}

function initializeCharacterSelect() {
    const characterGrid = document.querySelector('.character-grid');
    if (!characterGrid) {
        return;
    }
    characterGrid.innerHTML = '';

    Object.entries(characterTypes).forEach(([id, char]) => {
        const option = document.createElement('div');
        option.className = `character-option ${char.unlocked ? 'unlocked' : 'locked'} ${id === currentCharacter ? 'selected' : ''}`;
        option.dataset.characterId = id;

        const preview = document.createElement('div');
        preview.className = 'character-preview';
        preview.innerHTML = char.svg;

        const name = document.createElement('div');
        name.className = 'character-name';
        name.textContent = char.name;

        option.appendChild(preview);
        option.appendChild(name);

        if (!char.unlocked) {
            const lock = document.createElement('div');
            lock.className = 'character-locked';
            lock.textContent = '🔒';
            option.appendChild(lock);

            const tooltip = document.createElement('div');
            tooltip.className = 'character-tooltip';

            let requirementText = 'Locked';
            if (char.requirement) {
                if (char.requirement.startsWith('score_')) {
                    const scoreReq = char.requirement.split('_')[1];
                    requirementText = `Reach ${scoreReq} points to unlock`;
                } else if (char.requirement.startsWith('achievement_')) {
                    const achievementCount = char.requirement.split('_')[1];
                    requirementText = achievementCount === '5' ?
                        'Unlock ALL achievements to unlock' :
                        `Unlock ${achievementCount} achievements to unlock`;
                } else if (achievements[char.requirement]) {
                    requirementText = `Unlock "${achievements[char.requirement].name}" achievement`;
                }
            }
            tooltip.textContent = requirementText;
            option.appendChild(tooltip);
        }

        if (char.unlocked) {
            option.addEventListener('click', () => {
                selectCharacter(id);
            });
        }
        characterGrid.appendChild(option);
    });
}

function resetGameProgress() {
    try {
        localStorage.removeItem('dinoGameProgress');
        currentCharacter = 'default';
        score = 0;
        highScore = 0;
        leaderboard = [];

        Object.values(achievements).forEach(achievement => {
            achievement.unlocked = false;
        });
        unlockedAchievements.clear();

        Object.entries(characterTypes).forEach(([id, char]) => {
            if (id !== 'default') {
                char.unlocked = false;
            } else {
                char.unlocked = true;
            }
        });

        const dino = document.getElementById('dino');
        if (dino) {
            const defaultChar = characterTypes.default;
            const svgDataUrl = 'data:image/svg+xml,' + encodeURIComponent(defaultChar.svg);
            dino.style.backgroundImage = `url("${svgDataUrl}")`;
        }

        initializeCharacterSelect();
        initializeAchievements();
        initializeLeaderboard();
        updateStartButton();
        updateHighScoreDisplay();

        titleScreen.style.display = 'block';
        gameContainer.style.display = 'none';

        const resetModal = document.getElementById('reset-confirm-modal');
        if (resetModal) {
            resetModal.style.display = 'none';
        }
    } catch (error) {
        // error resetting
    }
}

function initializeResetButton() {
    const resetBtn = document.getElementById('reset-save-btn');
    const resetModal = document.getElementById('reset-confirm-modal');
    const confirmYes = resetModal.querySelector('.reset-confirm-yes');
    const confirmNo = resetModal.querySelector('.reset-confirm-no');

    if (resetBtn && resetModal && confirmYes && confirmNo) {
        resetBtn.addEventListener('click', () => {
            resetModal.style.display = 'block';
        });

        confirmYes.addEventListener('click', () => {
            resetGameProgress();
        });

        confirmNo.addEventListener('click', () => {
            resetModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === resetModal) {
                resetModal.style.display = 'none';
            }
        });
    }
}

function initializeGame() {
    loadGameProgress();
    initializeAchievements();
    initializeLeaderboard();
    initializeCharacterSelect();
    initializeResetButton();
    initializeBackground();
    updateStartButton();

    const startGameBtn = document.getElementById('start-game');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', function () {
            if (currentCharacter) {
                startGame();
            }
        });
    }

    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function () {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

initializeGame();

let clouds = [];
let isNight = false;
let sky, cloudsLayer, nightLayer;

function initializeBackground() {
    sky = document.querySelector('.bg-sky');
    cloudsLayer = document.querySelector('.bg-clouds');
    nightLayer = document.querySelector('.bg-night');

    createClouds();
    animateBackground();

    // Initial colors
    sky.style.setProperty('--sky-color1', '#87ceeb');
    sky.style.setProperty('--sky-color2', '#87ceeb');
    sky.style.setProperty('--ground-color', '#deb887');
}

function createClouds() {
    if (!cloudsLayer) return;
    cloudsLayer.innerHTML = '';
    clouds = [];
    for (let i = 0; i < 3; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        cloud.style.left = (Math.random() * 500) + 'px';
        cloud.style.top = (Math.random() * 40 + 10) + 'px';
        cloudsLayer.appendChild(cloud);
        clouds.push({ el: cloud, speed: 0.1 + Math.random() * 0.1 });
    }
}

function animateBackground() {
    clouds.forEach(cloud => {
        let left = parseFloat(cloud.el.style.left);
        left += cloud.speed;
        if (left > 600) left = -48;
        cloud.el.style.left = left + 'px';
    });
    requestAnimationFrame(animateBackground);
}

function updateDayNightCycle(currentScore) {
    if (!sky || !nightLayer) return;

    const cycle = Math.floor(currentScore / 500) % 2;
    if (cycle !== (isNight ? 1 : 0)) {
        isNight = !isNight;
        if (isNight) {
            nightLayer.classList.add('active');
        } else {
            nightLayer.classList.remove('active');
        }
        let sky1 = isNight ? '#22334a' : '#87ceeb';
        let sky2 = isNight ? '#22334a' : '#87ceeb';
        let ground = isNight ? '#bfa77a' : '#deb887';
        sky.style.setProperty('--sky-color1', sky1);
        sky.style.setProperty('--sky-color2', sky2);
        sky.style.setProperty('--ground-color', ground);
    }
}

function showAchievementPopup(id, name, desc) {
    const popup = document.getElementById('achievement-popup');
    if (popup) {
        popup.querySelector('.achievement-name').textContent = name;
        popup.querySelector('.achievement-description').textContent = desc;
        popup.classList.add('show');
        setTimeout(() => { popup.classList.remove('show'); }, 3000);
    }
}
