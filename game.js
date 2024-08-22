const levels = [
    { cupCount: 3, slotCount: 3, timeLimit: 60 },
    { cupCount: 3, slotCount: 3, timeLimit: 45 },
    { cupCount: 3, slotCount: 3, timeLimit: 30 },
    { cupCount: 4, slotCount: 4, timeLimit: 60 },
    { cupCount: 4, slotCount: 4, timeLimit: 45 },
    { cupCount: 5, slotCount: 5, timeLimit: 60 },
    { cupCount: 5, slotCount: 5, timeLimit: 45 },
    { cupCount: 6, slotCount: 6, timeLimit: 60 },
    { cupCount: 7, slotCount: 7, timeLimit: 60 },
    { cupCount: 8, slotCount: 6, timeLimit: 60 }, // 8 cups, 6 slots
    { cupCount: 8, slotCount: 6, timeLimit: 60, stacked: true }, // 8 cups, 6 slots, with stacking
    { cupCount: 9, slotCount: 7, timeLimit: 60 }, 
    { cupCount: 10, slotCount: 8, timeLimit: 60 } 
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

    shuffledCups = generateCups(levelData.cupCount);
    correctOrder = [...shuffledCups].sort(() => Math.random() - 0.5);

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.slotCount, levelData.stacked);

    startTimer(levelData.timeLimit);
}

function generateCups(count) {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'beige', 'teal'];
    const selectedColors = colors.slice(0, count);
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

function createCupSlots(count, stackingAllowed = false) {
    const arrangementContainer = document.getElementById('arrangement-container');
    arrangementContainer.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const slotElement = document.createElement('div');
        slotElement.className = 'cup-slot';
        slotElement.setAttribute('data-index', i);
        slotElement.addEventListener('dragover', dragOver);
        slotElement.addEventListener('drop', (event) => drop(event, stackingAllowed));
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

function drop(event, stackingAllowed) {
    event.preventDefault();
    const targetSlot = event.target;

    if (targetSlot.classList.contains('cup-slot') && selectedCupElement) {
        const targetCup = targetSlot.querySelector('.cup');

        if (stackingAllowed) {
            // Allow stacking up to two cups per slot
            if (targetSlot.childElementCount < 2) {
                targetSlot.appendChild(selectedCupElement);
            }
        } else {
            // No stacking allowed, so only allow one cup per slot
            if (!targetCup) {
                targetSlot.appendChild(selectedCupElement);
            } else {
                // Swap cups between slots
                selectedCupElement.parentElement.appendChild(targetCup);
                targetSlot.appendChild(selectedCupElement);
            }
        }

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
    const levelData = levels[currentLevel];
    const stackingAllowed = levelData.stacked;

    if (draggedOverElement && draggedOverElement.classList.contains('cup-slot') && selectedCupElement) {
        const targetCup = draggedOverElement.querySelector('.cup');

        if (stackingAllowed) {
            // Allow stacking for touch if stacking is allowed in the level
            if (draggedOverElement.childElementCount < 2) {
                draggedOverElement.appendChild(selectedCupElement);
            }
        } else {
            // No stacking allowed for touch
            if (!targetCup) {
                draggedOverElement.appendChild(selectedCupElement);
            } else {
                // Swap cups for touch
                selectedCupElement.parentElement.appendChild(targetCup);
                draggedOverElement.appendChild(selectedCupElement);
            }
        }

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
        const cupsInSlot = [...slot.querySelectorAll('.cup')];
        return cupsInSlot.map(cup => cup.style.backgroundColor);
    });

    let correctCount = 0;

    arrangedCups.forEach((colors, index) => {
        if (colors.length === correctOrder[index].length && colors.every((color, i) => color === correctOrder[index][i])) {
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

