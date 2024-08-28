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
    { cupCount: 12, timeLimit: 75, duplicateColors: 12 }
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

    shuffledCups = generateCups(levelData.cupCount, levelData.duplicateColors || 0);
    correctOrder = [...shuffledCups]; // Correct order is the order of generated cups before shuffling

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
    cupElement.addEventListener('dragend', dragEnd);
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
    event.dataTransfer.setData('text/plain', event.target.style.backgroundColor);
    
    // Disable default drag ghost image
    event.dataTransfer.setDragImage(new Image(), 0, 0);
    
    // Add dragging class for visual feedback
    selectedCupElement.classList.add('dragging');
}

function dragOver(event) {
    event.preventDefault(); // Necessary to allow drop
}

function drop(event) {
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

// Touch Functions for Mobile
function touchStart(event) {
    selectedCupElement = event.target;
    selectedCupElement.style.position = 'absolute'; // Prepare for dragging
    selectedCupElement.style.zIndex = '1000'; // Bring to the front
}

function touchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    draggedOverElement = document.elementFromPoint(touch.clientX, touch.clientY);

    // Update the position of the selected cup
    selectedCupElement.style.left = `${touch.clientX - selectedCupElement.offsetWidth / 2}px`;
    selectedCupElement.style.top = `${touch.clientY - selectedCupElement.offsetHeight / 2}px`;
}

function touchEnd() {
    // Check if the dragged over element is a valid slot
    if (draggedOverElement && draggedOverElement.classList.contains('cup-slot') && selectedCupElement) {
        // Perform the swap
        swapCups(draggedOverElement); 
    } else {
        // Return cup to stack if not placed in a valid slot
        returnCupToStack({ target: selectedCupElement });
    }
    resetTouchVariables();
}

function resetTouchVariables() {
    selectedCupElement.style.position = ''; // Reset position
    selectedCupElement.style.left = '';
    selectedCupElement.style.top = '';
    selectedCupElement.style.zIndex = '';
    selectedCupElement = null;
    draggedOverElement = null;
}

function returnCupToStack(event) {
    document.getElementById('stack-container').appendChild(event.target); // Return cup to stack
}

function swapCups(targetSlot) {
    const targetCup = targetSlot.querySelector('.cup');

    if (targetCup) {
        selectedCupElement.parentElement.appendChild(targetCup); // Swap cups
    }

    targetSlot.appendChild(selectedCupElement);

    // Add smooth transition
    selectedCupElement.style.transition = 'transform 0.2s ease';
    setTimeout(() => {
        selectedCupElement.style.transition = ''; // Remove transition after applying
    }, 200);
}

function checkArrangement() {
    const arrangedCups = getArrangedCups();
    const correctCount = calculateCorrectCups(arrangedCups);

    if (correctCount === correctOrder.length) {
        handleLevelCompletion();
    } else {
        showModal(`${correctCount} out of ${correctOrder.length} cups are correct.`);
    }
}

function getArrangedCups() {
    return Array.from(document.querySelectorAll('.cup-slot .cup')).map(cup => cup.style.backgroundColor);
}

function calculateCorrectCups(arrangedCups) {
    return arrangedCups.reduce((correctCount, color, index) => {
        return correctCount + (color === correctOrder[index] ? 1 : 0);
    }, 0);
}

function handleLevelCompletion() {
    if (currentLevel + 1 < levels.length) {
        currentLevel++;
        showModal('Level completed! Moving to the next level.');
        startLevel(); // Proceed to the next level
    } else {
        showModal('Congratulations! You have completed all levels!');
        endGame();
    }
}

// Timer Functions
function startTimer(timeLeft) {
    const timeLeftElement = document.getElementById('time-left');
    timeLeftElement.innerText = timeLeft;

    timerInterval = setInterval(() => {
        updateTimeLeft(--timeLeft, timeLeftElement);

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showModal('Time\'s up! Game over.');
            endGame();
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

function endGame() {
    clearInterval(timerInterval);
    switchToPage('home-page');
    resetGame();
}

function resetGame() {
    currentLevel = 0;
}

function switchToPage(pageId) {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('game-page').style.display = 'none';
    document.getElementById(pageId).style.display = 'block';
}

function showModal(message) {
    const modal = document.createElement('div');
    modal.className = 'modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const modalText = document.createElement('p');
    modalText.innerText = message;

    const modalClose = document.createElement('button');
    modalClose.innerText = 'Close';
    modalClose.className = 'modal-close';
    modalClose.addEventListener('click', () => closeModal(modal));

    modalContent.appendChild(modalText);
    modalContent.appendChild(modalClose);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    modal.style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
    modal.remove();
}
