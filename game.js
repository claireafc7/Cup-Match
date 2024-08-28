// Game Configuration and State Variables
const levels = [
    { cupCount: 3, timeLimit: 60 },
    { cupCount: 12, timeLimit: 90, duplicateColors: 12 },
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
    correctOrder = [...shuffledCups].sort(() => Math.random() - 0.5);

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.cupCount);

    startTimer(levelData.timeLimit);
}

function updateLevelInfo(levelData) {
    document.getElementById('level').innerText = `Level ${currentLevel + 1}`;
    document.getElementById('time-left').innerText = levelData.timeLimit;
}

function generateCups(count, duplicateColors = 0) {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'beige', 'teal'];
    let selectedColors = colors.slice(0, count);

    // Add duplicate colors if needed
    for (let i = 0; i < duplicateColors; i++) {
        selectedColors.push(selectedColors[Math.floor(Math.random() * selectedColors.length)]);
    }

    // Handle case where all cups are the same color
    if (duplicateColors >= count) {
        selectedColors = [selectedColors[0]].repeat(count); // All cups will be the same color
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

function createCupElement(color) {
    const cupElement = document.createElement('div');
    cupElement.className = 'cup';
    cupElement.style.backgroundColor = color;
    cupElement.setAttribute('draggable', true);

    // Event listeners for drag and touch actions
    cupElement.addEventListener('dragstart', dragStart);
    cupElement.addEventListener('click', returnCupToStack);
    addTouchEvents(cupElement);

    return cupElement;
}

function addTouchEvents(cupElement) {
    cupElement.addEventListener('touchstart', touchStart);
    cupElement.addEventListener('touchmove', touchMove);
    cupElement.addEventListener('touchend', touchEnd);
}

// Drag and Drop Functions for Desktop
function dragStart(event) {
    if (isPaused) return;
    selectedCupElement = event.target;
    event.dataTransfer.setData('text/plain', event.target.style.backgroundColor);
    event.target.style.transform = 'scale(1.1)'; // Scale up for visual feedback
}

function dragOver(event) {
    event.preventDefault(); // Necessary to allow drop
}

function drop(event) {
    event.preventDefault();
    if (isPaused) return;
    const targetSlot = event.target;

    if (targetSlot.classList.contains('cup-slot') && selectedCupElement) {
        swapCups(targetSlot);
    }
}

function swapCups(targetSlot) {
    const targetCup = targetSlot.querySelector('.cup');

    if (targetCup) {
        selectedCupElement.parentElement.appendChild(targetCup); // Swap cups
    }

    targetSlot.appendChild(selectedCupElement);
    selectedCupElement.style.transform = ''; // Reset scaling
    selectedCupElement = null;
}

// Touch Functions for Mobile
function touchStart(event) {
    if (isPaused) return;
    selectedCupElement = event.target;
    selectedCupElement.style.transform = 'scale(1.1)'; // Scale up for visual feedback
}

function touchMove(event) {
    if (isPaused) return;
    event.preventDefault();
    const touch = event.touches[0];
    draggedOverElement = document.elementFromPoint(touch.clientX, touch.clientY);

    if (draggedOverElement && draggedOverElement.classList.contains('cup-slot')) {
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
    selectedCupElement.style.transform = ''; // Reset scaling
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

    console.log('Arranged Cups:', arrangedCups);
    console.log('Correct Order:', correctOrder);

    if (correctCount === correctOrder.length) {
        handleLevelCompletion();
    } else {
        showModal(`${correctCount} out of ${correctOrder.length} cups are correct. Try again!`);
    }
}

function getArrangedCups() {
    return [...document.getElementById('arrangement-container').children].map(slot => {
        const cup = slot.querySelector('.cup');
        return cup ? cup.style.backgroundColor : null;
    });
}

function calculateCorrectCups(arrangedCups) {
    return arrangedCups.reduce((count, color, index) => {
        return color === correctOrder[index] ? count + 1 : count;
    }, 0);
}

function startTimer(duration) {
    let timeLeft = duration;
    document.getElementById('time-left').innerText = timeLeft;
    timerInterval = setInterval(() => {
        if (isPaused) return;
        timeLeft -= 1;
        document.getElementById('time-left').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showModal('Time\'s up! Game Over.');
        }
    }, 1000);
}

function handleLevelCompletion() {
    clearInterval(timerInterval);
    currentLevel++;
    if (currentLevel < levels.length) {
        showModal('Level Completed! Proceeding to the next level.');
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

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-game').innerText = isPaused ? 'Resume' : 'Pause';
}

function endGame() {
    clearInterval(timerInterval);
    switchToPage('home-page');
}

function showInstructions() {
    document.getElementById('instructions-modal').style.display = 'block';
}

function switchToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'flex';
}
