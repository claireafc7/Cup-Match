// Game Configuration and State Variables
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
    { cupCount: 12, timeLimit: 75, duplicateColors: 12 }
];

const deceptiveLevels = [
    { cupCount: 4, timeLimit: 60, deceptiveCount: 1 },
    { cupCount: 5, timeLimit: 60, deceptiveCount: 2 },
    { cupCount: 6, timeLimit: 60, deceptiveCount: 3 },
    // Add more deceptive levels as needed
];

let currentLevel = 0;
let timerInterval;
let isPaused = false;
let cups = [];

document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('check-arrangement').addEventListener('click', checkArrangement);
document.getElementById('pause-game').addEventListener('click', togglePause);
document.getElementById('end-game').addEventListener('click', endGame);
document.getElementById('how-to-play-button').addEventListener('click', () => showModal('How to Play'));
document.getElementById('close-how-to-play').addEventListener('click', () => {
    document.getElementById('how-to-play-modal').style.display = 'none';
});

function startGame() {
    currentLevel = 0;
    switchToPage('game-page');
    startLevel();
}

function startLevel() {
    const level = levels[currentLevel];
    const deceptiveLevel = deceptiveLevels[currentLevel] || { deceptiveCount: 0 };
    setupLevel(level, deceptiveLevel);
}

function setupLevel(level, deceptiveLevel) {
    clearInterval(timerInterval);
    const stackContainer = document.getElementById('stack-container');
    const arrangementContainer = document.getElementById('arrangement-container');
    stackContainer.innerHTML = '';
    arrangementContainer.innerHTML = '';
    cups = [];

    const cupColors = Array(level.cupCount).fill(null).map((_, i) => `color-${i + 1}`);
    for (let i = 0; i < deceptiveLevel.deceptiveCount; i++) {
        cupColors.push(`deceptive-color-${i + 1}`);
    }
    
    shuffleArray(cupColors).forEach(color => {
        const cup = document.createElement('div');
        cup.className = 'cup';
        cup.dataset.color = color;
        cups.push(cup);
        stackContainer.appendChild(cup);
        setupDragAndDrop(cup);
    });

    for (let i = 0; i < level.cupCount; i++) {
        const slot = document.createElement('div');
        slot.className = 'cup-slot';
        slot.dataset.slot = i;
        arrangementContainer.appendChild(slot);
    }

    document.getElementById('level').textContent = `Level ${currentLevel + 1}`;
    startTimer(level.timeLimit);
}

function setupDragAndDrop(cup) {
    let isDragging = false;

    cup.addEventListener('mousedown', (e) => {
        isDragging = true;
        cup.style.zIndex = '1000';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            cup.style.zIndex = '';
            const slot = document.elementFromPoint(event.clientX, event.clientY);
            if (slot && slot.classList.contains('cup-slot')) {
                slot.appendChild(cup);
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            cup.style.left = `${e.clientX - cup.offsetWidth / 2}px`;
            cup.style.top = `${e.clientY - cup.offsetHeight / 2}px`;
        }
    });
}

function checkArrangement() {
    const slots = Array.from(document.querySelectorAll('.cup-slot'));
    const arrangement = slots.map(slot => slot.querySelector('.cup')).filter(cup => cup !== null);
    const correctCount = getCorrectCupCount(arrangement);
    if (correctCount === levels[currentLevel].cupCount) {
        showModal('Correct Arrangement!');
        handleLevelCompletion();
    } else {
        showModal('Incorrect Arrangement, Try Again!');
    }
}

function getCorrectCupCount(arrangement) {
    const correctColors = arrangement.map(cup => cup.dataset.color);
    return arrangement.filter((cup, index) => cup.dataset.color === correctColors[index]).length;
}

function handleLevelCompletion() {
    currentLevel++;
    if (currentLevel >= levels.length) {
        endGame();
    } else {
        startLevel();
    }
}

function startTimer(duration) {
    let timeLeft = duration;
    document.getElementById('time-left').textContent = timeLeft;

    timerInterval = setInterval(() => {
        if (isPaused) return;
        timeLeft--;
        document.getElementById('time-left').textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showModal('Time is up!');
        }
    }, 1000);
}

function showModal(message) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-content"><p>${message}</p><button id="close-modal">Close</button></div>`;
    document.body.appendChild(modal);

    document.getElementById('close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

function togglePause() {
    isPaused = !isPaused;
    const pauseButton = document.getElementById('pause-game');
    pauseButton.textContent = isPaused ? 'Resume Game' : 'Pause Game';

    if (isPaused) {
        clearInterval(timerInterval);
    } else {
        const timeLeft = parseInt(document.getElementById('time-left').textContent, 10);
        startTimer(timeLeft);
    }
}

function endGame() {
    clearInterval(timerInterval);
    switchToPage('home-page');
}

function switchToPage(pageId) {
    document.querySelector('.page').style.display = 'none';
    document.getElementById(pageId).style.display = 'block';
}

// Utility Functions
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}
