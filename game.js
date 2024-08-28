// Level configuration
const levels = [
    { cupCount: 3, timeLimit: 60 },
    { cupCount: 3, timeLimit: 45 },
    { cupCount: 3, timeLimit: 30 },
    { cupCount: 4, timeLimit: 60 },
    { cupCount: 4, timeLimit: 45 },
    { cupCount: 5, timeLimit: 60 },
    { cupCount: 5, timeLimit: 45 },
    { cupCount: 6, timeLimit: 60 },
    { cupCount: 7, timeLimit: 60 },
    { cupCount: 8, timeLimit: 60 },
    { cupCount: 9, timeLimit: 60 },
    { cupCount: 10, timeLimit: 60 },
    { cupCount: 10, timeLimit: 75, duplicateColors: 4 },
    { cupCount: 10, timeLimit: 75, duplicateColors: 8 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 4 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 8 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 12, extraCups: 3 }
];

let currentLevel = 0;   // Tracks the current level
let presetArrangement = [];
let userArrangement = [];
let gameTimer = null;
let cupColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'cyan', 'magenta', 'lime', 'teal'];

// Initialize the game for the current level
function initGame() {
    const levelConfig = levels[currentLevel];
    generatePresetArrangement(levelConfig);
    createCups(levelConfig);
    createSlots(levelConfig.cupCount);
    startTimer(levelConfig.timeLimit);
}

// Generate the preset arrangement based on level configuration
function generatePresetArrangement(levelConfig) {
    presetArrangement = [];
    let colorPool = [...cupColors].slice(0, levelConfig.cupCount);

    // Add duplicates if specified
    if (levelConfig.duplicateColors) {
        for (let i = 0; i < levelConfig.duplicateColors; i++) {
            colorPool.push(colorPool[Math.floor(Math.random() * colorPool.length)]);
        }
    }

    // Create the preset arrangement
    for (let i = 0; i < levelConfig.cupCount; i++) {
        presetArrangement.push(colorPool[Math.floor(Math.random() * colorPool.length)]);
    }

    // Add extra cups for deception if specified
    if (levelConfig.extraCups) {
        for (let i = 0; i < levelConfig.extraCups; i++) {
            presetArrangement.push(cupColors[Math.floor(Math.random() * cupColors.length)]);
        }
    }

    // Shuffle the preset arrangement to make it random
    presetArrangement = shuffleArray(presetArrangement);
}

// Create cups in the cups section
function createCups(levelConfig) {
    const cupsSection = document.getElementById('cups-section');
    cupsSection.innerHTML = '';

    presetArrangement.forEach(color => {
        const cup = document.createElement('div');
        cup.classList.add('cup');
        cup.style.backgroundColor = color;
        cup.setAttribute('draggable', 'true');
        cup.addEventListener('dragstart', handleDragStart);
        cup.addEventListener('dragend', handleDragEnd);
        cup.addEventListener('click', handleCupClick);
        cupsSection.appendChild(cup);
    });
}

// Create slots in the slots section based on the cup count
function createSlots(cupCount) {
    const slotsSection = document.getElementById('slots-section');
    slotsSection.innerHTML = '';

    for (let i = 0; i < cupCount; i++) {
        const slot = document.createElement('div');
        slot.classList.add('slot');
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
        slotsSection.appendChild(slot);
    }
}

// Drag and Drop Event Handlers
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.style.backgroundColor);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const color = e.dataTransfer.getData('text/plain');
    e.target.style.backgroundColor = color;
    e.target.classList.add('filled');
}

// Handle Cup Click (returns to cup section)
function handleCupClick(e) {
    const cup = e.target;
    cup.remove();
    document.getElementById('cups-section').appendChild(cup);
}

// Shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Start the game timer
function startTimer(timeLimit) {
    const startTime = Date.now();
    gameTimer = setInterval(() => {
        const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
        const timeRemaining = timeLimit - timeElapsed;

        if (timeRemaining <= 0) {
            clearInterval(gameTimer);
            alert('Time\'s up! Game over.');
            window.location.reload(); // Restart the game
        } else {
            document.getElementById('timer').textContent = `Time remaining: ${timeRemaining}s`;
        }
    }, 1000);
}

// Check the arrangement
function checkArrangement() {
    const slots = document.querySelectorAll('.slot');
    let correctCount = 0;

    slots.forEach((slot, index) => {
        if (slot.style.backgroundColor === presetArrangement[index]) {
            correctCount++;
        }
    });

    // Show result in the modal
    const resultText = document.getElementById('result-text');
    resultText.textContent = `${correctCount} out of ${levels[currentLevel].cupCount} cups are correct!`;
    document.getElementById('result-modal').style.display = 'block';

    // If all are correct, go to the next level
    if (correctCount === levels[currentLevel].cupCount) {
        alert('Congratulations! You completed the level.');
        nextLevel();
    }
}

// Move to the next level
function nextLevel() {
    currentLevel++;
    if (currentLevel < levels.length) {
        initGame();
    } else {
        alert('You have completed all levels! Game over.');
        window.location.reload(); // Restart the game
    }
}

// Start Game
document.getElementById('start-game').addEventListener('click', () => {
    document.getElementById('home-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    initGame();
});

// How to Play Modal
const howToPlayModal = document.getElementById('how-to-play-modal');
document.getElementById('how-to-play').addEventListener('click', () => {
    howToPlayModal.style.display = 'block';
});

howToPlayModal.querySelector('.close').addEventListener('click', () => {
    howToPlayModal.style.display = 'none';
});

// Check Arrangement
document.getElementById('check-arrangement').addEventListener('click', checkArrangement);

// Result Modal Close
const resultModal = document.getElementById('result-modal');
resultModal.querySelector('.close').addEventListener('click', () => {
    resultModal.style.display = 'none';
});

// End Game Button
document.getElementById('end-game').addEventListener('click', () => {
    alert('Game Ended!');
    window.location.reload();
});

// Pause Game Button
document.getElementById('pause-game').addEventListener('click', () => {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
        alert('Game Paused');
    }
});
