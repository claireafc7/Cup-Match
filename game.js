// Game Configuration and State Variables
const levels = [
    { cupCount: 3, timeLimit: 60 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 8 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 12 },
    { cupCount: 12, timeLimit: 90, extraCups: 4 },
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
    shuffledCups = generateCups(totalCups, levelData.cupCount, levelData.duplicateColors || 0);
    correctOrder = shuffledCups.slice(0, levelData.cupCount); // First N cups are the correct order

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.cupCount); // Create slots based on the cup count

    startTimer(levelData.timeLimit);
}

function updateLevelInfo(levelData) {
    document.getElementById('level').innerText = `Level ${currentLevel + 1}`;
    document.getElementById('time-left').innerText = levelData.timeLimit;
}

function generateCups(totalCupCount, actualCupCount, duplicateColors = 0) {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'beige', 'teal'];
    let selectedColors = colors.slice(0, actualCupCount - duplicateColors);

    // Add duplicate colors
    for (let i = 0; i < duplicateColors; i++) {
        selectedColors.push(selectedColors[Math.floor(Math.random() * selectedColors.length)]);
    }

    // Generate cups with colors
    const cups = [];
    for (let i = 0; i < totalCupCount; i++) {
        cups.push({ color: selectedColors[i % selectedColors.length], id: i });
    }

    return shuffleArray(cups);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function displayCupsInStack(cups) {
    const stackContainer = document.getElementById('stack-container');
    stackContainer.innerHTML = ''; // Clear previous cups

    cups.forEach(cup => {
        const cupElement = createCupElement(cup.color, cup.id);
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
    cupElement.setAttribute('data-cup-id', id); // Unique ID for each cup

    // Event listeners for drag and touch actions
    cupElement.addEventListener('dragstart', dragStart);
    cupElement.addEventListener('dragend', dragEnd); 
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
    document.getElementById('stack-container').appendChild(event.target);
}

function startTimer(duration) {
    let timeRemaining = duration;
    document.getElementById('time-left').innerText = timeRemaining;

    timerInterval = setInterval(() => {
        if (isPaused) return;
        timeRemaining--;
        document.getElementById('time-left').innerText = timeRemaining;

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert('Time is up! Game Over.');
            endGame();
        }
    }, 1000);
}

function checkArrangement() {
    if (isPaused) return;
    const userArrangement = Array.from(document.querySelectorAll('#arrangement-container .cup'))
        .map(cup => cup.style.backgroundColor);

    const correctArrangement = correctOrder.map(cup => cup.color);

    if (arraysEqual(userArrangement, correctArrangement)) {
        alert('Correct! Moving to next level.');
        currentLevel++;
        if (currentLevel < levels.length) {
            startLevel();
        } else {
            alert('Congratulations! You have completed all levels.');
            endGame();
        }
    } else {
        alert('Incorrect arrangement. Try again.');
    }
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((value, index) => value === arr2[index]);
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-game').innerText = isPaused ? 'Resume Game' : 'Pause Game';
}

function showInstructions() {
    document.getElementById('instructions-modal').style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function endGame() {
    clearInterval(timerInterval);
    switchToPage('home-page');
}

function switchToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = page.id === pageId ? 'block' : 'none';
    });
}
