// Game Configuration and State Variables
const levels = [
    { cupCount: 8, timeLimit: 90, extraCups: 4 }, // New levels
    { cupCount: 8, timeLimit: 90, extraCups: 6 }
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

    const totalCups = levelData.cupCount + (levelData.extraCups || 0); // Total cups including extra ones
    shuffledCups = generateCups(totalCups, levelData.cupCount, levelData.duplicateColors || 0); // Generate cups with unique IDs
    correctOrder = shuffledCups.slice(0, levelData.cupCount); // Correct order only includes the actual cup count

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.cupCount);

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

    let cups = [];
    for (let i = 0; i < totalCupCount; i++) {
        cups.push({ color: selectedColors[i % selectedColors.length], id: i }); // Assign unique ID to each cup
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
        const cupElement = createCupElement(cup.color, cup.id);
        stackContainer.appendChild(cupElement);
    });
}

function createCupElement(color, id) {
    const cupElement = document.createElement('div');
    cupElement.className = 'cup';
    cupElement.style.backgroundColor = color;
    cupElement.setAttribute('draggable', true);
    cupElement.setAttribute('data-cup-id', id); // Assign the unique ID to the cup element

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

function createCupSlots(count) {
    const arrangementContainer = document.getElementById('arrangement-container');
    arrangementContainer.innerHTML = ''; // Clear previous slots

    // Create slots only for the correct number of cups (no extra slots)
    for (let i = 0; i < count; i++) {
        const slotElement = createCupSlotElement(i);
        arrangementContainer.appendChild(slotElement);
    }
}

function createCupSlotElement(index) {
    const slotElement = document.createElement('div');
    slotElement.className = 'cup-slot';
    slotElement.setAttribute('data-slot-id', index); // Assign the unique ID to the slot element

    slotElement.addEventListener('dragover', dragOver);
    slotElement.addEventListener('drop', drop);
    return slotElement;
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
    const cupId = selectedCupElement.getAttribute('data-cup-id');
    const slotId = targetSlot.getAttribute('data-slot-id');

    if (targetSlot && cupId === slotId) { // Check if cup's ID matches the slot's ID
        swapCups(targetSlot);
    } else {
        showModal("Wrong slot! This cup doesn't belong here.");
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

function touchEnd(event) {
    if (isPaused) return;
    document.querySelectorAll('.cup-slot.highlight').forEach(el => el.classList.remove('highlight'));

    if (draggedOverElement) {
        const slotId = draggedOverElement.getAttribute('data-slot-id');
        const cupId = selectedCupElement.getAttribute('data-cup-id');

        if (cupId === slotId) { // Check if cup's ID matches the slot's ID
            swapCups(draggedOverElement);
        } else {
            showModal("Wrong slot! This cup doesn't belong here.");
        }
        draggedOverElement = null;
    }

    selectedCupElement.classList.remove('dragging');
    selectedCupElement = null;
}

function checkArrangement() {
    const slots = document.querySelectorAll('.cup-slot');
    const currentOrder = [];

    slots.forEach(slot => {
        const cup = slot.querySelector('.cup');
        if (cup) {
            const cupId = parseInt(cup.getAttribute('data-cup-id'), 10);
            currentOrder.push(cupId);
        } else {
            currentOrder.push(null); // No cup in this slot
        }
    });

    if (isCorrectArrangement(currentOrder)) {
        if (currentLevel === levels.length - 1) {
            showModal('Congratulations! You completed the final level!');
        } else {
            currentLevel++;
            showModal(`Level ${currentLevel} complete! Get ready for the next level.`);
            startLevel();
        }
    } else {
        showModal('Incorrect arrangement! Try again.');
    }
}

function isCorrectArrangement(order) {
    for (let i = 0; i < correctOrder.length; i++) {
        if (order[i] === null || order[i] !== correctOrder[i].id) {
            return false;
        }
    }
    return true;
}

function startTimer(duration) {
    clearInterval(timerInterval); // Clear any previous intervals
    let timeRemaining = duration;

    timerInterval = setInterval(() => {
        if (isPaused) return;

        timeRemaining--;
        document.getElementById('time-left').innerText = timeRemaining;

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            showModal('Time\'s up! Try again.');
        }
    }, 1000);
}

function endGame() {
    switchToPage('start-page');
    clearInterval(timerInterval); // Stop the timer
}

function togglePause() {
    isPaused = !isPaused;
    const pauseButton = document.getElementById('pause-game');
    pauseButton.innerText = isPaused ? 'Resume' : 'Pause';

    if (isPaused) {
        clearInterval(timerInterval); // Pause the timer
    } else {
        const timeRemaining = parseInt(document.getElementById('time-left').innerText, 10);
        startTimer(timeRemaining); // Resume the timer
    }
}

function showInstructions() {
    showModal(document.getElementById('instructions-modal').innerHTML); // Show modal with instructions
}

function returnCupToStack(event) {
    const cup = event.target;
    document.getElementById('stack-container').appendChild(cup); // Move cup back to stack
}

function showModal(modalContent) {
    const modal = document.getElementById('modal');
    modal.querySelector('.modal-content').innerHTML = modalContent;
    modal.style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function switchToPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
    });

    document.getElementById(pageId).style.display = 'block';
}
