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
    { cupCount: 10, timeLimit: 75, duplicateColors: 2 },
    { cupCount: 10, timeLimit: 75, duplicateColors: 4 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 6 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 2 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 4 },
    { cupCount: 10, timeLimit: 90, extraCups: 4 },
    { cupCount: 10, timeLimit: 90, extraCups: 6 },
    { cupCount: 12, timeLimit: 90, extraCups: 4, killerCup: true }
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
    shuffledCups = generateCups(totalCups, levelData.cupCount, levelData.duplicateColors || 0, levelData.killerCup || false);
    correctOrder = shuffledCups.slice(0, levelData.cupCount); // First N cups are the correct order

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.cupCount); // Create slots based on the cup count

    startTimer(levelData.timeLimit);
}

function updateLevelInfo(levelData) {
    document.getElementById('level').innerText = `Level ${currentLevel + 1}`;
    document.getElementById('time-left').innerText = levelData.timeLimit;
}

function generateCups(totalCupCount, actualCupCount, duplicateColors = 0, hasKillerCup = false) {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'beige', 'teal', 'black', 'white', 'cyan', 'lilac', 'burlywood', 'gold', 'grey'];
    let selectedColors = colors.slice(0, actualCupCount - duplicateColors);

    // Add duplicate colors
    for (let i = 0; i < duplicateColors; i++) {
        selectedColors.push(selectedColors[Math.floor(Math.random() * selectedColors.length)]);
    }

    // Generate cups with colors
    const cups = [];
    for (let i = 0; i < totalCupCount; i++) {
        cups.push({ color: selectedColors[i % selectedColors.length], id: i, type: 'normal' });
    }

    // Add a killer cup if required
    if (hasKillerCup) {
        cups.push({ color: 'black', id: totalCupCount, type: 'killer' }); // Killer cup has a unique color for identification
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
        const cupElement = createCupElement(cup.color, cup.id, cup.type);
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

function createCupElement(color, id, type) {
    const cupElement = document.createElement('div');
    cupElement.className = 'cup';
    cupElement.style.backgroundColor = color;
    cupElement.setAttribute('draggable', true);
    cupElement.setAttribute('data-cup-id', id); // Unique ID for each cup
    cupElement.setAttribute('data-cup-type', type); // Type of cup: normal or killer

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

    if (selectedCupElement.getAttribute('data-cup-type') === 'killer') {
        clearArrangement();
        selectedCupElement.classList.remove('dragging'); // Remove dragging class
        selectedCupElement = null;
        return;
    }

    if (targetCup) {
        selectedCupElement.parentElement.appendChild(targetCup); // Swap cups
    }

    targetSlot.appendChild(selectedCupElement);
    selectedCupElement.classList.remove('dragging'); // Remove dragging class
    selectedCupElement = null;
}

function clearArrangement() {
    document.querySelectorAll('#arrangement-container .cup').forEach(cup => {
        document.getElementById('stack-container').appendChild(cup); // Return cups to stack
    });
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
    }
}

function touchEnd(event) {
    if (isPaused) return;
    if (draggedOverElement) {
        swapCups(draggedOverElement);
    }

    selectedCupElement.classList.remove('dragging'); // Remove visual feedback
    selectedCupElement = null;
    draggedOverElement = null;
}

function checkArrangement() {
    if (isPaused) return;
    const arrangedCups = getArrangedCups();
    const correctCupCount = calculateCorrectCups(arrangedCups);
    if (correctCupCount === correctOrder.length) {
        // Level Complete
        endGame();
        alert('Congratulations! You have completed the level.');
    } else {
        alert(`You have ${correctCupCount} correct cups.`);
    }
}

function getArrangedCups() {
    return [...document.getElementById('arrangement-container').children].map(slot => {
        const cup = slot.querySelector('.cup');
        return cup ? { color: cup.style.backgroundColor, id: cup.getAttribute('data-cup-id') } : null;
    });
}

function calculateCorrectCups(arrangedCups) {
    return arrangedCups.reduce((count, cup, index) => {
        const correctCup = correctOrder[index];
        return count + (cup.color === correctCup.color && cup.id === correctCup.id ? 1 : 0);
    }, 0);
}

function startTimer(timeLimit) {
    const timerElement = document.getElementById('time-left');
    let timeLeft = timeLimit;

    timerInterval = setInterval(() => {
        if (isPaused) return;
        timeLeft--;
        timerElement.innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame();
            alert('Time\'s up!');
        }
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    switchToPage('main-menu');
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-game').innerText = isPaused ? 'Resume' : 'Pause';
}

function showInstructions() {
    document.getElementById('instructions-modal').style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function returnCupToStack(event) {
    if (isPaused) return;
    const cupElement = event.target;
    if (cupElement.classList.contains('cup')) {
        document.getElementById('stack-container').appendChild(cupElement); // Return cup to stack
    }
}

function switchToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
}
