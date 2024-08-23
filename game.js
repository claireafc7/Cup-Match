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
    { cupCount: 10, timeLimit: 60 }
];

let currentLevel = 0;
let timerInterval;
let shuffledCups = [];
let correctOrder = [];
let selectedCupElement = null;
let draggedOverElement = null;

document.addEventListener('DOMContentLoaded', () => {
    const startGameButton = document.getElementById('start-game');
    startGameButton.addEventListener('click', startGame);

    const endGameButton = document.getElementById('end-game');
    endGameButton.addEventListener('click', endGame);

    const checkArrangementButton = document.getElementById('check-arrangement');
    checkArrangementButton.addEventListener('click', checkArrangement);

    // Prevent page refresh
    window.addEventListener('beforeunload', (event) => {
        event.preventDefault();
        event.returnValue = ''; // This triggers the confirmation dialog in most browsers
    });
});

function startGame() {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('game-page').style.display = 'block';
    startLevel();
}

function startLevel() {
    const levelData = levels[currentLevel];
    document.getElementById('level').innerText = `Level ${currentLevel + 1}`;
    document.getElementById('time-left').innerText = levelData.timeLimit;

    // Determine the number of duplicate colors for this level (starting from level 10)
    const duplicateColors = currentLevel >= 12 ? Math.floor(levelData.cupCount / 2) : 0;

    shuffledCups = generateCups(levelData.cupCount, duplicateColors);
    correctOrder = [...shuffledCups].sort(() => Math.random() - 0.5);

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.cupCount);

    startTimer(levelData.timeLimit);
}

function generateCups(count, duplicateColors = 0) {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'beige', 'teal'];
    const selectedColors = colors.slice(0, count - duplicateColors);

    // Add duplicate colors
    for (let i = 0; i < duplicateColors; i++) {
        selectedColors.push(selectedColors[Math.floor(Math.random() * selectedColors.length)]);
    }

    return selectedColors.sort(() => Math.random() - 0.5);
}

function displayCupsInStack(cups) {
    const stackContainer = document.getElementById('stack-container');
    stackContainer.innerHTML = '';

    cups.forEach(color => {
        const cupElement = createCupElement(color);
        stackContainer.appendChild(cupElement);
    });
}

function createCupSlots(count) {
    const arrangementContainer = document.getElementById('arrangement-container');
    arrangementContainer.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const slotElement = document.createElement('div');
        slotElement.className = 'cup-slot';
        slotElement.setAttribute('data-index', i);
        slotElement.addEventListener('dragover', dragOver);
        slotElement.addEventListener('drop', drop);
        arrangementContainer.appendChild(slotElement);
    }
}

function createCupElement(color) {
    const cupElement = document.createElement('div');
    cupElement.className = 'cup';
    cupElement.style.backgroundColor = color;
    cupElement.setAttribute('draggable', true);
    cupElement.addEventListener('dragstart', dragStart);
    cupElement.addEventListener('click', returnCupToStack);

    // Touch support for mobile
    cupElement.addEventListener('touchstart', touchStart);
    cupElement.addEventListener('touchmove', touchMove);
    cupElement.addEventListener('touchend', touchEnd);

    return cupElement;
}

// Drag and Drop Functions for Desktop
function dragStart(event) {
    selectedCupElement = event.target;
    event.dataTransfer.setData('text/plain', event.target.style.backgroundColor);
}

function dragOver(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    const targetSlot = event.target;

    if (targetSlot.classList.contains('cup-slot') && selectedCupElement) {
        const targetCup = targetSlot.querySelector('.cup');

        if (targetCup) {
            // Swap cups between slots
            selectedCupElement.parentElement.appendChild(targetCup);
        }

        targetSlot.appendChild(selectedCupElement);
        selectedCupElement = null;
    }
}

// Touch Functions for Mobile
function touchStart(event) {
    selectedCupElement = event.target;
}

function touchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);

    if (elementAtTouch && elementAtTouch.classList.contains('cup-slot')) {
        draggedOverElement = elementAtTouch;
    }
}

function touchEnd() {
    if (draggedOverElement && draggedOverElement.classList.contains('cup-slot') && selectedCupElement) {
        const targetCup = draggedOverElement.querySelector('.cup');

        if (targetCup) {
            // Swap cups between slots for touch
            selectedCupElement.parentElement.appendChild(targetCup);
        }

        draggedOverElement.appendChild(selectedCupElement);
        selectedCupElement = null;
        draggedOverElement = null;
    }
}

function returnCupToStack(event) {
    const stackContainer = document.getElementById('stack-container');
    stackContainer.appendChild(event.target);
}

function checkArrangement() {
    const arrangedCups = [...document.getElementById('arrangement-container').children].map(slot => {
        const cup = slot.querySelector('.cup');
        return cup ? cup.style.backgroundColor : null;
    });

    let correctCount = 0;

    arrangedCups.forEach((color, index) => {
        if (color === correctOrder[index]) {
            correctCount++;
        }
    });

    if (correctCount === correctOrder.length) {
        clearInterval(timerInterval);
        
        // Check if it's the last level
        if (currentLevel + 1 < levels.length) {
            showModal('Correct! Moving to the next level.');
            currentLevel++;
            startLevel();
        } else {
            showModal('Congratulations! You have completed all levels!');
            endGame();
        }
    } else {
        showModal(`${correctCount} out of ${correctOrder.length} cups are in the correct position. Try again!`);
    }
}

function startTimer(seconds) {
    let timeLeft = seconds;
    const timeLeftElement = document.getElementById('time-left');
    timeLeftElement.innerText = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        timeLeftElement.innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showModal('Time\'s up! Game over.');
            endGame();
        } else if (timeLeft <= 10) {
            timeLeftElement.classList.add('warning');
        } else {
            timeLeftElement.classList.remove('warning');
        }
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    document.getElementById('game-page').style.display = 'none';
    document.getElementById('home-page').style.display = 'block';
    currentLevel = 0;
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
    modalClose.addEventListener('click', () => {
        modal.style.display = 'none';
        modal.remove();
    });

    modalContent.appendChild(modalText);
    modalContent.appendChild(modalClose);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    modal.style.display = 'block';
}
