// Game Configuration and State Variables
const levels = [
    { cupCount: 2, timeLimit: 60 },
    { cupCount: 3, timeLimit: 60 },
    { cupCount: 4, timeLimit: 60 },
    { cupCount: 5, timeLimit: 60 },
    { cupCount: 6, timeLimit: 60 },
    { cupCount: 3, timeLimit: 45 },
    { cupCount: 4, timeLimit: 45 },
    { cupCount: 5, timeLimit: 45 },
    { cupCount: 7, timeLimit: 60 },
    { cupCount: 8, timeLimit: 60 },
    { cupCount: 9, timeLimit: 90 },
    { cupCount: 10, timeLimit: 90 },
    { cupCount: 11, timeLimit: 90 },
    { cupCount: 12, timeLimit: 90 },
    { cupCount: 9, timeLimit: 60 },
    { cupCount: 10, timeLimit: 75, duplicateColors: 3 },
    { cupCount: 10, timeLimit: 75, duplicateColors: 5 },
    { cupCount: 11, timeLimit: 75, duplicateColors: 4 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 4 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 6 },
    { cupCount: 12, timeLimit: 100, extraCups: 2 },
    { cupCount: 12, timeLimit: 100, extraCups: 3 },
    { cupCount: 12, timeLimit: 100, extraCups: 5 },
    { cupCount: 12, timeLimit: 100, extraCups: 7 },
    { cupCount: 12, timeLimit: 100, extraCups: 8 },
    { cupCount: 13, timeLimit: 100 },
    { cupCount: 14, timeLimit: 110 },
    { cupCount: 15, timeLimit: 120 },
    { cupCount: 16, timeLimit: 120 },
    { cupCount: 17, timeLimit: 120 },
    { cupCount: 17, timeLimit: 140, extraCups: 2 },
    { cupCount: 17, timeLimit: 140, extraCups: 3 },
    { cupCount: 18, timeLimit: 140 },
    { cupCount: 19, timeLimit: 140 },
    { cupCount: 20, timeLimit: 140 },
];

let currentLevel = 0;
let timerInterval;
let shuffledCups = [];
let correctOrder = [];
let selectedCupElement = null;
let isPaused = false;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    preventPageRefresh();
});

function setupEventListeners() {
    console.log('Setting up event listeners...');
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('end-game').addEventListener('click', endGame);
    document.getElementById('check-arrangement').addEventListener('click', checkArrangement);
    document.getElementById('pause-game').addEventListener('click', togglePause);
    document.getElementById('instructions-button').addEventListener('click', showInstructions);
    document.getElementById('modal-close').addEventListener('click', () => closeModal(document.getElementById('modal')));
    document.getElementById('close-instructions').addEventListener('click', () => closeModal(document.getElementById('instructions-modal')));
}

function preventPageRefresh() {
    window.addEventListener('beforeunload', (event) => {
        event.preventDefault();
        event.returnValue = ''; // Triggers confirmation dialog on refresh
    });
}

function startGame() {
    console.log('Start Game button clicked');
    switchToPage('game-page');
    startLevel();
}

function startLevel() {
    const levelData = levels[currentLevel];
    updateLevelInfo(levelData);

    const totalCups = levelData.cupCount + (levelData.extraCups || 0);
    shuffledCups = generateCups(totalCups, levelData.cupCount, levelData.duplicateColors || 0, levelData.extraCups || 0);

    // Randomize the correct order
    correctOrder = shuffleArray([...shuffledCups].slice(0, levelData.cupCount));

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.cupCount);

    startTimer(levelData.timeLimit);
}

function updateLevelInfo(levelData) {
    document.getElementById('level').innerText = `Level ${currentLevel + 1}`;
    document.getElementById('time-left').innerText = levelData.timeLimit;
}

function generateCups(totalCupCount, actualCupCount, duplicateColors = 0, extraCups = 0) {
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A6", "#FFFF33", "#33FFF5",
        "#A633FF", "#FF8C33", "#FF3333", "#8CFF33", "#33FFA2", "#3339FF",
        "#FFC733", "#33D1FF", "#FF33D6", "#FF5733", "#B833FF", "#33FF8F",
        "#FF33F6", "#FF9633"];

    // Step 1: Select Colors for the Main Cups
    let selectedColors = colors.slice(0, actualCupCount - duplicateColors);

    // Add duplicate colors
    for (let i = 0; i < duplicateColors; i++) {
        selectedColors.push(selectedColors[Math.floor(Math.random() * selectedColors.length)]);
    }

    // Step 2: Generate Cups for the Main Set
    const cups = [];
    for (let i = 0; i < actualCupCount; i++) {
        cups.push({ color: selectedColors[i % selectedColors.length], id: i });
    }

    // Step 3: Assign Unique Colors for Extra Cups
    if (extraCups > 0) {
        const remainingColors = colors.filter(color => !selectedColors.includes(color)); // Filter out used colors

        for (let i = 0; i < extraCups; i++) {
            if (remainingColors.length === 0) break; // In case we run out of unique colors
            const extraColor = remainingColors.shift(); // Take a unique color
            cups.push({ color: extraColor, id: actualCupCount + i });
        }
    }

    return shuffleArray(cups);
}

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

function displayCupsInStack(cups) {
    const stackContainer = document.getElementById('stack-container');
    stackContainer.innerHTML = '';

    cups.forEach(cup => {
        const cupElement = document.createElement('div');
        cupElement.className = 'cup';
        cupElement.style.backgroundColor = cup.color;
        cupElement.draggable = true;
        cupElement.dataset.id = cup.id;

        cupElement.addEventListener('dragstart', (event) => {
            selectedCupElement = event.target;
        });

        stackContainer.appendChild(cupElement);
    });
}

function createCupSlots(count) {
    const arrangementContainer = document.getElementById('arrangement-container');
    arrangementContainer.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const slot = document.createElement('div');
        slot.className = 'cup-slot';
        slot.addEventListener('dragover', (event) => event.preventDefault());
        slot.addEventListener('drop', handleDrop);

        arrangementContainer.appendChild(slot);
    }
}

function handleDrop(event) {
    event.preventDefault();
    if (selectedCupElement) {
        event.target.appendChild(selectedCupElement);
        selectedCupElement = null;
    }
}

function checkArrangement() {
    const slots = document.querySelectorAll('#arrangement-container .cup-slot');
    const userArrangement = Array.from(slots).map(slot => slot.querySelector('.cup')?.dataset.id);

    if (arraysEqual(userArrangement, correctOrder.map(cup => cup.id))) {
        showModal('Congratulations! You have completed this level.');
        setTimeout(() => {
            currentLevel++;
            if (currentLevel < levels.length) {
                startLevel();
            } else {
                showModal('You have completed all levels! Restarting from Level 1.');
                currentLevel = 0;
                startLevel();
            }
        }, 2000);
    } else {
        showModal('Incorrect arrangement. Try again!');
    }
}

function arraysEqual(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
}

function startTimer(duration) {
    let timeLeft = duration;
    document.getElementById('time-left').innerText = timeLeft;

    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showModal('Time is up! The level failed.');
            return;
        }
        timeLeft--;
        document.getElementById('time-left').innerText = timeLeft;
    }, 1000);
}

function togglePause() {
    if (isPaused) {
        startTimer(parseInt(document.getElementById('time-left').innerText));
        isPaused = false;
        document.getElementById('pause-game').innerText = 'Pause Game';
    } else {
        clearInterval(timerInterval);
        isPaused = true;
        document.getElementById('pause-game').innerText = 'Resume Game';
    }
}

function endGame() {
    showModal('Game Ended. Returning to Home Page.');
    setTimeout(() => {
        switchToPage('home-page');
    }, 2000);
}

function showInstructions() {
    document.getElementById('instructions-modal').style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function showModal(message) {
    document.getElementById('modal-message').innerText = message;
    document.getElementById('modal').style.display = 'block';
}

function switchToPage(pageId) {
    document.getElementById('home-page').style.display = pageId === 'home-page' ? 'block' : 'none';
    document.getElementById('game-page').style.display = pageId === 'game-page' ? 'block' : 'none';
}
