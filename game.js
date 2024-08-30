// Game Configuration and State Variables
const levels = [
    { cupCount: 3, timeLimit: 60, killer: false },
    { cupCount: 3, timeLimit: 45, killer: false },
    { cupCount: 3, timeLimit: 30, killer: false },
    { cupCount: 4, timeLimit: 60, killer: true },
    { cupCount: 4, timeLimit: 45, killer: false },
    { cupCount: 5, timeLimit: 60, killer: false },
    { cupCount: 5, timeLimit: 45, killer: false },
    { cupCount: 6, timeLimit: 60, killer: true },
    { cupCount: 7, timeLimit: 60, killer: false },
    { cupCount: 8, timeLimit: 60, killer: false },
    { cupCount: 9, timeLimit: 60, killer: false },
    { cupCount: 10, timeLimit: 60, killer: false },
    { cupCount: 10, timeLimit: 75, killer: true, duplicateColors: 2 },
    { cupCount: 10, timeLimit: 75, killer: false, duplicateColors: 4 },
    { cupCount: 12, timeLimit: 75, killer: false, duplicateColors: 6 },
    { cupCount: 12, timeLimit: 75, killer: false, duplicateColors: 2 },
    { cupCount: 12, timeLimit: 75, killer: true, duplicateColors: 4 },
    { cupCount: 10, timeLimit: 90, killer: false, extraCups: 4 },
    { cupCount: 10, timeLimit: 90, killer: false, extraCups: 6 },
    { cupCount: 12, timeLimit: 90, killer: false, extraCups: 4 }
];

let currentLevel = 0;
let timerInterval;
let shuffledCups = [];
let correctOrder = [];
let selectedCupElement = null;
let draggedOverElement = null;
let isPaused = false;
let killerCupIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    preventPageRefresh();
});

function setupEventListeners() {
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
    switchToPage('game-page');
    startLevel();
}

function startLevel() {
    const levelData = levels[Math.floor(Math.random() * levels.length)];
    updateLevelInfo(levelData);

    const totalCups = levelData.cupCount + (levelData.extraCups || 0);
    shuffledCups = generateCups(totalCups, levelData.cupCount, levelData.duplicateColors || 0);
    correctOrder = shuffledCups.slice(0, levelData.cupCount); // First N cups are the correct order

    // Determine if a killer cup is needed
    if (levelData.killer) {
        killerCupIndex = Math.floor(Math.random() * shuffledCups.length); // Randomly assign killer cup
        shuffledCups[killerCupIndex].isKiller = true; // Mark one cup as the killer cup
    }

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.cupCount); // Create slots based on the cup count

    startTimer(levelData.timeLimit);
}

function updateLevelInfo(levelData) {
    document.getElementById('level').innerText = `Level ${currentLevel + 1}`;
    document.getElementById('time-left').innerText = levelData.timeLimit;
}

function generateCups(totalCupCount, actualCupCount, duplicateColors = 0) {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'beige', 'teal', 'black', 'white', 'cyan', 'lilac', 'burlywood', 'gold', 'grey'];
    let selectedColors = colors.slice(0, actualCupCount - duplicateColors);

    // Add duplicate colors
    for (let i = 0; i < duplicateColors; i++) {
        selectedColors.push(selectedColors[Math.floor(Math.random() * selectedColors.length)]);
    }

    // Generate cups with colors
    const cups = [];
    for (let i = 0; i < totalCupCount; i++) {
        cups.push({ color: selectedColors[i % selectedColors.length], id: i, isKiller: false });
    }

    return shuffleArray(cups);
}

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

function displayCupsInStack(cups) {
    const stackContainer = document.getElementById('stack-container');
    stackContainer.innerHTML = ''; // Clear previous cups

    cups.forEach(cup => {
        const cupElement = createCupElement(cup.color, cup.id, cup.isKiller);
        stackContainer.appendChild(cupElement);
    });
}

function createCupSlots(count) {
    const arrangementContainer = document.getElementById('arrangement-container');
    arrangementContainer.innerHTML = ''; // Clear previous slots

    for (let i = 0; i < count; i++) {
        const slotElement = document.createElement('div');
        slotElement.classList.add('cup-slot');
        slotElement.dataset.index = i;

        slotElement.addEventListener('dragover', (e) => e.preventDefault());
        slotElement.addEventListener('drop', handleDrop);

        arrangementContainer.appendChild(slotElement);
    }
}

function createCupElement(color, id, isKiller = false) {
    const cupElement = document.createElement('div');
    cupElement.classList.add('cup');
    cupElement.style.backgroundColor = color;
    cupElement.dataset.id = id;
    cupElement.dataset.isKiller = isKiller;

    cupElement.draggable = true;
    cupElement.addEventListener('dragstart', (e) => handleDragStart(e, cupElement));
    cupElement.addEventListener('dragend', (e) => handleDragEnd(e, cupElement));

    return cupElement;
}

function handleDragStart(event, cupElement) {
    event.dataTransfer.setData('text/plain', cupElement.dataset.id);
    selectedCupElement = cupElement;
    setTimeout(() => {
        cupElement.classList.add('dragging');
    }, 0);
}

function handleDragEnd(event, cupElement) {
    cupElement.classList.remove('dragging');
    selectedCupElement = null;
}

function handleDrop(event) {
    event.preventDefault();

    if (selectedCupElement) {
        const slotElement = event.currentTarget;
        slotElement.appendChild(selectedCupElement);

        if (selectedCupElement.dataset.isKiller === 'true') {
            resetGame();
        }
    }
}

function startTimer(duration) {
    const timeLeftElement = document.getElementById('time-left');
    let timeLeft = duration;

    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeLeft--;
            timeLeftElement.innerText = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                alert('Time is up! Game Over.');
                endGame();
            }

            if (timeLeft <= 10) {
                timeLeftElement.classList.add('warning');
            }
        }
    }, 1000);
}

function checkArrangement() {
    const slots = document.querySelectorAll('#arrangement-container .cup-slot');
    const currentArrangement = Array.from(slots).map(slot => slot.firstChild ? slot.firstChild.dataset.id : null);
    const correctArrangement = correctOrder.map(cup => cup.id);

    const correctCount = currentArrangement.reduce((count, id, index) => {
        return count + (id === correctArrangement[index] ? 1 : 0);
    }, 0);

    if (JSON.stringify(currentArrangement) === JSON.stringify(correctArrangement)) {
        showModal(`Correct! You have placed ${correctCount} out of ${correctArrangement.length} cups correctly. Moving to the next level.`);
        currentLevel++;
        startLevel();
    } else {
        showModal(`Incorrect arrangement. You have placed ${correctCount} out of ${correctArrangement.length} cups correctly. Try again!`);
    }
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-game').innerText = isPaused ? 'Resume Game' : 'Pause Game';
}

function endGame() {
    switchToPage('home-page');
    clearInterval(timerInterval);
    resetGame();
}

function resetGame() {
    document.getElementById('stack-container').innerHTML = '';
    document.getElementById('arrangement-container').innerHTML = '';
    document.getElementById('time-left').classList.remove('warning');
    clearInterval(timerInterval);
}

function showModal(message) {
    document.getElementById('result-message').innerText = message;
    document.getElementById('modal').style.display = 'block';
}

function showInstructions() {
    document.getElementById('instructions-modal').style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function switchToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
}
