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
    shuffledCups = generateCups(totalCups, levelData.duplicateColors || 0);
    correctOrder = [...shuffledCups].slice(0, levelData.cupCount); // Only consider the correct number of cups

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.cupCount, levelData.extraCups || 0);

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

    return shuffleArray(selectedColors);
}

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

function displayCupsInStack(cups) {
    const stackContainer = document.getElementById('stack-container');
    stackContainer.innerHTML = ''; // Clear previous cups

    cups.forEach(color => {
        const cupElement = createCupElement(color);
        stackContainer.appendChild(cupElement);
    });
}

function createCupSlots(correctCount, extraCount) {
    const arrangementContainer = document.getElementById('arrangement-container');
    arrangementContainer.innerHTML = ''; // Clear previous slots

    // Create slots for the correct cups
    for (let i = 0; i < correctCount; i++) {
        const slotElement = createCupSlotElement(i, false); // false -> not an extra slot
        arrangementContainer.appendChild(slotElement);
    }

    // Create extra slots that won't be checked
    for (let i = 0; i < extraCount; i++) {
        const extraSlotElement = createCupSlotElement(i + correctCount, true); // true -> extra slot
        arrangementContainer.appendChild(extraSlotElement);
    }
}

function createCupSlotElement(index, isExtraSlot) {
    const slotElement = document.createElement('div');
    slotElement.className = 'cup-slot';
    slotElement.setAttribute('data-index', index);

    // Mark extra slots with a different class if needed
    if (isExtraSlot) {
        slotElement.classList.add('extra-slot');
    }

    slotElement.addEventListener('dragover', dragOver);
    slotElement.addEventListener('drop', drop);
    return slotElement;
}

function createCupElement(color) {
    const cupElement = document.createElement('div');
    cupElement.className = 'cup';
    cupElement.style.backgroundColor = color;
    cupElement.setAttribute('draggable', true);

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
    // Only get cups from non-extra slots
    return [...document.querySelectorAll('#arrangement-container .cup-slot:not(.extra-slot)')].map(slot => {
        const cup = slot.querySelector('.cup');
        return cup ? cup.style.backgroundColor : null;
    });
}

function calculateCorrectCups(arrangedCups) {
    return arrangedCups.reduce((count, color, index) => {
        return count + (color === correctOrder[index] ? 1 : 0);
    }, 0);
}

function handleLevelCompletion() {
    clearInterval(timerInterval);

    if (currentLevel + 1 < levels.length) {
        showModal('Correct! Moving to the next level.');
        currentLevel++;
        startLevel();
    } else {
        showModal('Congratulations! You have completed all levels!');
        endGame();
    }
}

function startTimer(seconds) {
    let timeLeft = seconds;
    const timeLeftElement = document.getElementById('time-left');
    updateTimeLeft(timeLeft, timeLeftElement);

    timerInterval = setInterval(() => {
        if (!isPaused) {
            updateTimeLeft(--timeLeft, timeLeftElement);

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                showModal('Time\'s up! Game over.');
                endGame();
            }
        }
    }, 1000);
}

function updateTimeLeft(timeLeft, timeLeftElement) {
    timeLeftElement.innerText = timeLeft;
    if (timeLeft <= 10) {
        timeLeftElement.classList.add('warning');
    } else {
        timeLeftElement.classList.remove('warning');
    }
}

function togglePause() {
    if (isPaused) {
        isPaused = false;
        document.getElementById('pause-game').innerText = 'Pause Game';
        startTimer(parseInt(document.getElementById('time-left').innerText)); // Resume timer
    } else {
        isPaused = true;
        document.getElementById('pause-game').innerText = 'Resume Game';
        clearInterval(timerInterval); // Pause timer
    }
}

function endGame() {
    clearInterval(timerInterval);
    switchToPage('home-page');
    currentLevel = 0;
}

function switchToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
}

function showModal(message) {
    const modal = document.getElementById('modal');
    modal.querySelector('p').innerText = message;
    modal.style.display = 'block';
}

function showInstructions() {
    const instructionsModal = document.getElementById('instructions-modal');
    instructionsModal.style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}
