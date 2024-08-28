// Game Configuration and State Variables
const levels = [
    { cupCount: 3, timeLimit: 60 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 12 },
    { cupCount: 12, timeLimit: 90, extraCups: 4 }, // New levels
    { cupCount: 14, timeLimit: 90, extraCups: 6 }
];

let currentLevel = 0;
let timerInterval;
let shuffledCups = [];
let correctOrder = [];
let selectedCupElement = null;
let draggedOverElement = null;
let isPaused = false;

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
    const levelData = levels[currentLevel];
    updateLevelInfo(levelData);

    const totalCups = levelData.cupCount + (levelData.extraCups || 0);
    const slotCount = levelData.cupCount;  // Keep slot count based on cupCount, not totalCups
    shuffledCups = generateCups(totalCups, levelData.duplicateColors || 0);
    
    correctOrder = [...shuffledCups].map((color, index) => `${color}-${index}`);  // Add unique identifiers

    displayCupsInStack(shuffledCups);
    createCupSlots(slotCount);

    startTimer(levelData.timeLimit);
}

function updateLevelInfo(levelData) {
    document.getElementById('level').innerText = `Level ${currentLevel + 1}`;
    document.getElementById('time-left').innerText = levelData.timeLimit;
}

function generateCups(count, duplicateColors = 0) {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'beige', 'teal'];
    let selectedColors = colors.slice(0, count - duplicateColors);

    // Add duplicate colors
    for (let i = 0; i < duplicateColors; i++) {
        selectedColors.push(selectedColors[Math.floor(Math.random() * selectedColors.length)]);
    }

    return shuffleArray(selectedColors).map((color, index) => `${color}-${index}`);  // Assign unique IDs
}

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

function displayCupsInStack(cups) {
    const stackContainer = document.getElementById('stack-container');
    stackContainer.innerHTML = ''; // Clear previous cups

    cups.forEach(cupId => {
        const color = cupId.split('-')[0];  // Extract color
        const cupElement = createCupElement(color, cupId);  // Pass cupId for identification
        stackContainer.appendChild(cupElement);
    });
}

function createCupSlots(count) {
    const arrangementContainer = document.getElementById('arrangement-container');
    arrangementContainer.innerHTML = ''; // Clear previous slots

    for (let i = 0; i < count; i++) {
        const slotElement = createCupSlotElement(i);
        arrangementContainer.appendChild(slotElement);
    }
}

function createCupSlotElement(index) {
    const slotElement = document.createElement('div');
    slotElement.className = 'cup-slot';
    slotElement.setAttribute('data-index', index);
    slotElement.addEventListener('dragover', dragOver);
    slotElement.addEventListener('drop', drop);
    return slotElement;
}

function createCupElement(color, id) {
    const cupElement = document.createElement('div');
    cupElement.className = 'cup';
    cupElement.style.backgroundColor = color;
    cupElement.setAttribute('draggable', true);
    cupElement.dataset.id = id;  // Assign the unique ID

    // Event listeners for drag and touch actions
    cupElement.addEventListener('dragstart', dragStart);
    cupElement.addEventListener('dragend', dragEnd); // Added for smooth drag end
    cupElement.addEventListener('click', returnCupToStack);
    addTouchEvents(cupElement);

    return cupElement;
}

function addTouchEvents(cupElement) {
    cupElement.addEventListener('touchstart', touchStart, { passive: false });
    cupElement.addEventListener('touchmove', touchMove, { passive: false });
    cupElement.addEventListener('touchend', touchEnd);
}

// Drag and Drop Functions for Desktop
function dragStart(event) {
    if (isPaused) return;
    selectedCupElement = event.target;
    selectedCupElement.classList.add('dragging');
}

function dragEnd(event) {
    if (isPaused) return;
    selectedCupElement.classList.remove('dragging');
    selectedCupElement = null;
}

function dragOver(event) {
    event.preventDefault(); // Necessary to allow drop
}

function drop(event) {
    event.preventDefault();
    if (isPaused) return;
    const targetSlot = event.target.closest('.cup-slot');

    if (targetSlot && selectedCupElement) {
        swapCups(targetSlot);
    }
}

function swapCups(targetSlot) {
    const targetCup = targetSlot.querySelector('.cup');

    if (targetCup) {
        selectedCupElement.parentElement.appendChild(targetCup); // Swap cups
    }

    targetSlot.appendChild(selectedCupElement);
    selectedCupElement.classList.remove('dragging'); // Remove dragging class
    selectedCupElement = null;
}

// Touch Functions for Mobile
function touchStart(event) {
    if (isPaused) return;
    selectedCupElement = event.target;
    selectedCupElement.classList.add('dragging'); // Visual feedback for touch
}

function touchMove(event) {
    if (isPaused) return;
    event.preventDefault();
    const touch = event.touches[0];
    const touchedElement = document.elementFromPoint(touch.clientX, touch.clientY);

    if (touchedElement && touchedElement.classList.contains('cup-slot')) {
        draggedOverElement = touchedElement;
        draggedOverElement.classList.add('highlight');
    } else {
        document.querySelectorAll('.cup-slot.highlight').forEach(el => el.classList.remove('highlight'));
    }
}

function touchEnd() {
    if (isPaused) return;
    if (draggedOverElement && draggedOverElement.classList.contains('cup-slot') && selectedCupElement) {
        swapCups(draggedOverElement); // Swap cups using touch
    }
    resetTouchVariables();
}

function resetTouchVariables() {
    if (draggedOverElement) {
        draggedOverElement.classList.remove('highlight');
    }
    if (selectedCupElement) {
        selectedCupElement.classList.remove('dragging'); // Remove dragging class
    }
    selectedCupElement = null;
    draggedOverElement = null;
}

function returnCupToStack(event) {
    if (isPaused) return;
    document.getElementById('stack-container').appendChild(event.target); // Return cup to stack
}

function checkArrangement() {
    if (isPaused) return;
    const arrangedCups = getArrangedCups();
    const correctCount = calculateCorrectCups(arrangedCups);

    if (correctCount === correctOrder.length) {
        handleLevelCompletion();
    } else {
        showModal(`${correctCount} out of ${correctOrder.length} cups are correct. Try again!`);
    }
}

function getArrangedCups() {
    return [...document.getElementById('arrangement-container').children].map(slot => {
        const cup = slot.querySelector('.cup');
        return cup ? cup.dataset.id : null;  // Return the unique ID instead of just color
    });
}

function calculateCorrectCups(arrangedCups) {
    let correctCount = 0;
    for (let i = 0; i < arrangedCups.length; i++) {
        if (arrangedCups[i] === correctOrder[i]) {
            correctCount++;
        }
    }
    return correctCount;
}

function handleLevelCompletion() {
    clearInterval(timerInterval);
    if (currentLevel + 1 < levels.length) {
        currentLevel++;
        showModal('Level completed! Get ready for the next level.');
        setTimeout(startLevel, 2000); // Delay before starting the next level
    } else {
        showModal('Congratulations! You have completed all levels!');
    }
}

function startTimer(timeLimit) {
    clearInterval(timerInterval); // Clear any previous timer
    let timeLeft = timeLimit;
    document.getElementById('time-left').innerText = timeLeft;

    timerInterval = setInterval(() => {
        if (isPaused) return;
        timeLeft--;
        document.getElementById('time-left').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showModal('Time\'s up! Try again.');
        }
    }, 1000);
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-game').innerText = isPaused ? 'Resume' : 'Pause';
    if (isPaused) {
        clearInterval(timerInterval);
    } else {
        const timeLeft = parseInt(document.getElementById('time-left').innerText, 10);
        startTimer(timeLeft);
    }
}

function showModal(message) {
    const modal = document.getElementById('modal');
    modal.querySelector('.modal-content p').innerText = message;
    modal.style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function showInstructions() {
    const instructionsModal = document.getElementById('instructions-modal');
    instructionsModal.style.display = 'block';
}

function endGame() {
    if (confirm('Are you sure you want to end the game? Your progress will be lost.')) {
        switchToPage('main-page');
        resetGame();
    }
}

function resetGame() {
    currentLevel = 0;
    clearInterval(timerInterval);
    document.getElementById('time-left').innerText = '0';
    document.getElementById('stack-container').innerHTML = '';
    document.getElementById('arrangement-container').innerHTML = '';
}

function switchToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
}
