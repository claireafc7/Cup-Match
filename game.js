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
    { cupCount: 10, timeLimit: 75, duplicateColors: 2 }, // Example level
    { cupCount: 10, timeLimit: 60, duplicateColors: 2 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 4 },
    { cupCount: 12, timeLimit: 60, extraCupCount: 4 },
    { cupCount: 12, timeLimit: 60, extraCupCount: 6 }
];

let currentLevel = 0;
let timerInterval;
let shuffledCups = [];
let correctOrder = [];
let selectedCupElement = null;
let draggedOverElement = null;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    preventPageRefresh();
});

function setupEventListeners() {
    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('end-game').addEventListener('click', endGame);
    document.getElementById('check-arrangement').addEventListener('click', checkArrangement);
    document.getElementById('pause-game').addEventListener('click', togglePauseGame);
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

    shuffledCups = generateCups(levelData.cupCount, levelData.duplicateColors || 0, levelData.extraCupCount || 0);
    correctOrder = shuffledCups.slice(0, levelData.cupCount - (levelData.extraCupCount || 0)); // The correct order excludes extra cups

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.cupCount);

    startTimer(levelData.timeLimit);
}

function updateLevelInfo(levelData) {
    document.getElementById('level').innerText = `Level ${currentLevel + 1}`;
    document.getElementById('time-left').innerText = levelData.timeLimit;
}

function generateCups(count, duplicateColors = 0, extraCupCount = 0) {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'beige', 'teal'];
    let selectedColors = colors.slice(0, count - duplicateColors);

    // Add duplicate colors
    for (let i = 0; i < duplicateColors; i++) {
        selectedColors.push(selectedColors[Math.floor(Math.random() * selectedColors.length)]);
    }

    // Shuffle to mix duplicates
    let allCups = shuffleArray(selectedColors);

    // Add extra cups if specified
    if (extraCupCount > 0) {
        const extraColors = shuffleArray(colors.slice(0, Math.min(colors.length, extraCupCount)));
        allCups = allCups.concat(extraColors.slice(0, extraCupCount));
    }

    return shuffleArray(allCups); // Final shuffle to mix all cups
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
    selectedCupElement = event.target;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target.outerHTML); // Save the HTML of the element
    setTimeout(() => (selectedCupElement.style.opacity = '0.5'), 0); // Add visual feedback
}

function dragOver(event) {
    event.preventDefault(); // Necessary to allow drop
    event.dataTransfer.dropEffect = 'move'; // Indicate that a move is happening
    const target = event.target;

    if (target.classList.contains('cup-slot') && target !== draggedOverElement) {
        draggedOverElement = target;
        highlightDropTarget(target);
    }
}

function drop(event) {
    event.preventDefault();

    const targetSlot = draggedOverElement || event.target;
    if (targetSlot.classList.contains('cup-slot') && selectedCupElement) {
        swapCups(targetSlot); // Perform the cup swap
    }
    clearDragState();
}

function swapCups(targetSlot) {
    const targetCup = targetSlot.querySelector('.cup');

    if (targetCup) {
        selectedCupElement.parentElement.appendChild(targetCup); // Swap cups if a cup exists in the target slot
    }

    targetSlot.appendChild(selectedCupElement); // Move the dragged cup to the target slot
    clearDragState();
}

function highlightDropTarget(target) {
    removeHighlightFromSlots(); // Remove highlight from previous target
    target.classList.add('highlight-slot'); // Add highlight to current target
}

function removeHighlightFromSlots() {
    document.querySelectorAll('.highlight-slot').forEach(slot => slot.classList.remove('highlight-slot'));
}

function clearDragState() {
    if (selectedCupElement) {
        selectedCupElement.style.opacity = '1'; // Reset opacity after drag or touch ends
    }
    selectedCupElement = null;
    draggedOverElement = null;
    removeHighlightFromSlots(); // Clear any highlights from drop targets
}

// Touch Functions for Mobile
function touchStart(event) {
    selectedCupElement = event.target;
    selectedCupElement.style.opacity = '0.5'; // Add visual feedback
}

function touchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);

    if (elementAtTouch && elementAtTouch.classList.contains('cup-slot') && elementAtTouch !== draggedOverElement) {
        draggedOverElement = elementAtTouch;
        highlightDropTarget(draggedOverElement);
    }
}

function touchEnd() {
    if (draggedOverElement && draggedOverElement.classList.contains('cup-slot') && selectedCupElement) {
        swapCups(draggedOverElement); // Perform the cup swap using touch
    }
    clearDragState();
    resetTouchVariables();
}

function resetTouchVariables() {
    if (selectedCupElement) {
        selectedCupElement.style.opacity = '1'; // Reset opacity
    }
    selectedCupElement = null;
    draggedOverElement = null;
}

function returnCupToStack(event) {
    document.getElementById('stack-container').appendChild(event.target); // Return cup to stack
}

function checkArrangement() {
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
        return cup ? cup.style.backgroundColor : null;
    });
}

function calculateCorrectCups(arrangedCups) {
    return arrangedCups.reduce((count, color, index) => {
        return color === correctOrder[index] ? count + 1 : count;
    }, 0);
}

function handleLevelCompletion() {
    clearInterval(timerInterval);

    if (currentLevel + 1 < levels.length) {
        showModal('Correct! Moving to the next level.');
        currentLevel++;
        startLevel();
    } else {
        showModal('Congratulations! You completed all levels!');
        endGame();
    }
}

function startTimer(timeLimit) {
    let timeLeft = timeLimit;
    document.getElementById('time-left').innerText = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('time-left').innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeUp();
        }
    }, 1000);
}

function handleTimeUp() {
    showModal('Time is up! Game Over!');
    endGame();
}

function endGame() {
    switchToPage('end-page');
    clearInterval(timerInterval);
    currentLevel = 0; // Reset the game to the first level
}

function switchToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
}

function showModal(message) {
    const modal = document.getElementById('message-modal');
    modal.querySelector('.modal-message').innerText = message;
    modal.style.display = 'block';

    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

function togglePauseGame() {
    const pauseButton = document.getElementById('pause-game');
    const isPaused = pauseButton.classList.toggle('paused');

    if (isPaused) {
        clearInterval(timerInterval);
        pauseButton.innerText = 'Resume';
        showModal('Game Paused');
    } else {
        startTimer(parseInt(document.getElementById('time-left').innerText));
        pauseButton.innerText = 'Pause';
    }
}

