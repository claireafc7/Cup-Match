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
    { cupCount: 12, timeLimit: 75, duplicateColors: 12, deceptiveCups: 5 } // Example with deceptive cups
];

let currentLevel = 0;
let timerInterval;
let cups = [];
let arrangement = [];
let selectedCupElement = null;
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

    // How to Play Modal Event Listeners
    const howToPlayButton = document.getElementById('how-to-play-button');
    const howToPlayModal = document.getElementById('how-to-play-modal');
    const closeHowToPlayButton = document.getElementById('close-how-to-play');

    howToPlayButton.addEventListener('click', () => {
        howToPlayModal.style.display = 'block';
    });

    closeHowToPlayButton.addEventListener('click', () => {
        howToPlayModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == howToPlayModal) {
            howToPlayModal.style.display = 'none';
        }
    });
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

    setupCups(levelData);
    startTimer(levelData.timeLimit);
}

function setupCups(levelData) {
    const stackContainer = document.getElementById('stack-container');
    const arrangementContainer = document.getElementById('arrangement-container');
    
    stackContainer.innerHTML = ''; // Clear previous cups
    arrangementContainer.innerHTML = ''; // Clear previous slots

    // Generate correct cups
    const cupColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']; // Example colors
    let allCupColors = [];

    for (let i = 0; i < levelData.cupCount - (levelData.duplicateColors || 0); i++) {
        allCupColors.push(cupColors[i % cupColors.length]);
    }

    for (let i = 0; i < (levelData.duplicateColors || 0); i++) {
        allCupColors.push(cupColors[i % cupColors.length]);
    }

    // Generate deceptive cups
    const deceptiveColors = cupColors.filter(color => !allCupColors.includes(color));
    for (let i = 0; i < (levelData.deceptiveCups || 0); i++) {
        allCupColors.push(deceptiveColors[i % deceptiveColors.length]);
    }

    allCupColors = shuffleArray(allCupColors);

    // Create cup elements
    allCupColors.forEach(color => {
        const cupElement = createCupElement(color);
        stackContainer.appendChild(cupElement);
    });

    // Generate slots for cups
    for (let i = 0; i < levelData.cupCount; i++) {
        const slotElement = createCupSlotElement(i);
        arrangementContainer.appendChild(slotElement);
    }
}

function createCupElement(color) {
    const cupElement = document.createElement('div');
    cupElement.className = 'cup';
    cupElement.style.backgroundColor = color;
    cupElement.setAttribute('draggable', true);
    cupElement.dataset.color = color;

    cupElement.addEventListener('dragstart', dragStart);
    cupElement.addEventListener('dragend', dragEnd);
    cupElement.addEventListener('click', returnCupToStack);
    addTouchEvents(cupElement);

    return cupElement;
}

function createCupSlotElement(index) {
    const slotElement = document.createElement('div');
    slotElement.className = 'cup-slot';
    slotElement.setAttribute('data-index', index);
    slotElement.addEventListener('dragover', dragOver);
    slotElement.addEventListener('drop', drop);
    return slotElement;
}

function addTouchEvents(cupElement) {
    cupElement.addEventListener('touchstart', touchStart);
    cupElement.addEventListener('touchmove', touchMove);
    cupElement.addEventListener('touchend', touchEnd);
}

// Drag and Drop Functions
function dragStart(event) {
    if (isPaused) return;
    selectedCupElement = event.target;
    event.dataTransfer.setData('text/plain', event.target.dataset.color);

    event.dataTransfer.setDragImage(new Image(), 0, 0);
    selectedCupElement.classList.add('dragging');
}

function dragOver(event) {
    if (isPaused) return;
    event.preventDefault(); // Necessary to allow drop
}

function drop(event) {
    if (isPaused) return;
    event.preventDefault();
    const targetSlot = event.target;

    if (targetSlot.classList.contains('cup-slot') && selectedCupElement) {
        swapCups(targetSlot);
    }
    selectedCupElement.classList.remove('dragging');
    selectedCupElement = null; // Reset the selected cup
}

function dragEnd() {
    if (selectedCupElement) {
        selectedCupElement.classList.remove('dragging');
    }
}

// Touch Functions
function touchStart(event) {
    if (isPaused) return;
    selectedCupElement = event.target;
    selectedCupElement.style.position = 'absolute';
    selectedCupElement.style.zIndex = '1000';
}

function touchMove(event) {
    if (isPaused) return;
    event.preventDefault();
    const touch = event.touches[0];
    const touchElement = document.elementFromPoint(touch.clientX, touch.clientY);

    // Update the position of the selected cup
    selectedCupElement.style.left = `${touch.clientX - selectedCupElement.offsetWidth / 2}px`;
    selectedCupElement.style.top = `${touch.clientY - selectedCupElement.offsetHeight / 2}px`;
}

function touchEnd() {
    if (isPaused) return;
    const touchElement = document.elementFromPoint(
        event.changedTouches[0].clientX,
        event.changedTouches[0].clientY
    );

    if (touchElement && touchElement.classList.contains('cup-slot') && selectedCupElement) {
        swapCups(touchElement);
    } else {
        returnCupToStack({ target: selectedCupElement });
    }

    resetTouchVariables();
}

function resetTouchVariables() {
    selectedCupElement.style.position = '';
    selectedCupElement.style.left = '';
    selectedCupElement.style.top = '';
    selectedCupElement.style.zIndex = '';
    selectedCupElement = null;
}

// Cup Arrangement Functions
function returnCupToStack(event) {
    if (isPaused) return;
    document.getElementById('stack-container').appendChild(event.target);
}

function swapCups(targetSlot) {
    if (isPaused) return;
    const targetCup = targetSlot.querySelector('.cup');

    if (targetCup) {
        selectedCupElement.parentElement.appendChild(targetCup);
    }

    targetSlot.appendChild(selectedCupElement);

    selectedCupElement.style.transition = 'transform 0.2s ease';
    setTimeout(() => {
        selectedCupElement.style.transition = '';
    }, 200);
}

function checkArrangement() {
    if (isPaused) return;
    const arrangedCups = getArrangedCups();
    const correctCount = calculateCorrectCups(arrangedCups);

    if (correctCount === arrangement.length) {
        handleLevelCompletion();
    } else {
        showModal(`${correctCount} out of ${arrangement.length} cups are correct.`);
    }
}

function getArrangedCups() {
    return Array.from(document.querySelectorAll('.cup-slot .cup')).map(cup => cup.dataset.color);
}

function calculateCorrectCups(arrangedCups) {
    const correctColors = arrangement.map(cup => cup.dataset.color);
    return arrangedCups.filter((color, index) => color === correctColors[index]).length;
}

function handleLevelCompletion() {
    currentLevel++;
    if (currentLevel >= levels.length) {
        endGame();
    } else {
        startLevel();
    }
}

function startTimer(duration) {
    let timeLeft = duration;
    document.getElementById('time-left').textContent = timeLeft;

    timerInterval = setInterval(() => {
        if (isPaused) return;
        timeLeft--;
        document.getElementById('time-left').textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showModal('Time is up!');
        }
    }, 1000);
}

function showModal(message) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-content"><p>${message}</p><button id="close-modal">Close</button></div>`;
    document.body.appendChild(modal);

    document.getElementById('close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

function togglePause() {
    isPaused = !isPaused;
    const pauseButton = document.getElementById('pause-game');
    pauseButton.textContent = isPaused ? 'Resume Game' : 'Pause Game';

    if (isPaused) {
        clearInterval(timerInterval);
    } else {
        const timeLeft = parseInt(document.getElementById('time-left').textContent, 10);
        startTimer(timeLeft);
    }
}

function endGame() {
    clearInterval(timerInterval);
    switchToPage('home-page');
}

function switchToPage(pageId) {
    document.querySelector('.page').style.display = 'none';
    document.getElementById(pageId).style.display = 'block';
}

// Utility Functions
function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}
