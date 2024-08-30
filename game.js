// Game Configuration and State Variables
const levels = [
    { cupCount: 3, timeLimit: 60 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 4 },
    { cupCount: 10, timeLimit: 90, extraCups: 4, includeKillerCup: true },
    { cupCount: 10, timeLimit: 90, extraCups: 6, includeKillerCup: true },
    { cupCount: 12, timeLimit: 90, extraCups: 4, includeKillerCup: true }
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
    shuffledCups = generateCups(totalCups, levelData.cupCount, levelData.duplicateColors || 0, levelData.includeKillerCup || false);
    correctOrder = shuffledCups.slice(0, levelData.cupCount); // First N cups are the correct order

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.cupCount); // Create slots based on the cup count

    startTimer(levelData.timeLimit);
}

function updateLevelInfo(levelData) {
    document.getElementById('level').innerText = `Level ${currentLevel + 1}`;
    document.getElementById('time-left').innerText = levelData.timeLimit;
}

function generateCups(totalCupCount, actualCupCount, duplicateColors = 0, includeKillerCup = false) {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'beige', 'teal', 'black', 'white', 'cyan', 'lilac', 'burlywood', 'gold', 'grey'];

    // Select a subset of colors and add duplicates
    let selectedColors = colors.slice(0, actualCupCount - duplicateColors);

    for (let i = 0; i < duplicateColors; i++) {
        // Add random duplicate color
        selectedColors.push(selectedColors[Math.floor(Math.random() * selectedColors.length)]);
    }

    // Generate cups with colors
    const cups = [];
    for (let i = 0; i < totalCupCount; i++) {
        cups.push({ color: selectedColors[i % selectedColors.length], id: i });
    }

    // Shuffle cups
    const shuffledCups = shuffleArray(cups);

    // Add Killer Cup if required
    if (includeKillerCup) {
        const killerCup = { color: 'black', id: 'killer' };
        shuffledCups.push(killerCup);
    }

    return shuffledCups;
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
        const existingCup = targetSlot.querySelector('.cup');
        console.log('Dropping:', selectedCupElement.style.backgroundColor, 'Into slot:', targetSlot);
        if (!existingCup || existingCup !== selectedCupElement) {
            swapCups(targetSlot);
        }
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
    if (draggedOverElement) {
        const targetSlot = draggedOverElement;
        swapCups(targetSlot);
        draggedOverElement.classList.remove('highlight');
    }
    selectedCupElement.classList.remove('dragging');
    selectedCupElement = null;
}

// Timer Functions
function startTimer(seconds) {
    const timeLeftElement = document.getElementById('time-left');
    let timeLeft = seconds;

    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame();
            return;
        }
        timeLeft--;
        timeLeftElement.innerText = timeLeft;
        if (timeLeft <= 10) {
            timeLeftElement.classList.add('warning');
        }
    }, 1000);
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-game').innerText = isPaused ? 'Resume Game' : 'Pause Game';
    document.getElementById('level-info').classList.toggle('paused', isPaused);
}

// End Game Function
function endGame() {
    clearInterval(timerInterval);
    showModal('Game Over! Click Start Game to play again.');
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
    const slots = document.querySelectorAll('#arrangement-container .cup-slot');
    const cups = Array.from(slots).map(slot => {
        const cup = slot.querySelector('.cup');
        console.log('Slot:', slot, 'Cup:', cup);
        return cup ? cup.style.backgroundColor : null;
    });
    console.log('Arranged Cups:', cups);
    return cups;
}

function calculateCorrectCups(arrangedCups) {
    return arrangedCups.reduce((count, color, index) => {
        const correctColor = correctOrder[index] ? correctOrder[index].color : null;
        return count + (color === correctColor ? 1 : 0);
    }, 0);
}

function handleLevelCompletion() {
    showModal('Congratulations! Level Completed.');
    currentLevel++;
    if (currentLevel < levels.length) {
        startLevel();
    } else {
        showModal('Congratulations! You have completed all levels.');
    }
}

function showModal(message) {
    const modal = document.getElementById('modal');
    modal.querySelector('p').innerText = message;
    modal.style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function showInstructions() {
    const instructionsModal = document.getElementById('instructions-modal');
    instructionsModal.style.display = 'block';
}

function returnCupToStack(event) {
    if (isPaused) return;
    const cupElement = event.target;
    const stackContainer = document.getElementById('stack-container');
    stackContainer.appendChild(cupElement);
    cupElement.classList.remove('dragging');
}

function switchToPage(pageId) {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('game-page').style.display = 'none';
    document.getElementById(pageId).style.display = 'flex';
}
