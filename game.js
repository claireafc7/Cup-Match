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
    { cupCount: 10, timeLimit: 75, duplicateColors: 6 },
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
}

function swapCups(targetSlot) {
    const targetCup = targetSlot.querySelector('.cup');

    if (targetCup) {
        selectedCupElement.parentElement.appendChild(targetCup); // Swap cups
    }

    targetSlot.appendChild(selectedCupElement);
    selectedCupElement = null;
}

// Touch Functions for Mobile
function touchStart(event) {
    selectedCupElement = event.target;
}

function touchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    draggedOverElement = document.elementFromPoint(touch.clientX, touch.clientY);
}

function touchEnd() {
    if (draggedOverElement && draggedOverElement.classList.contains('cup-slot') && selectedCupElement) {
        swapCups(draggedOverElement); // Swap cups using touch
    }
    resetTouchVariables();
}

function resetTouchVariables() {
    selectedCupElement = null;
    draggedOverElement = null;
}

function returnCupToStack(event) {
    document.getElementById('stack-container').appendChild(event.target); // Return cup to stack
}

function checkArrangement() {
    const arrangedCups = getArrangedCups(); // Get the cup colors in the arrangement slots
    const correctCount = calculateCorrectCups(arrangedCups); // Calculate how many are correct

    if (correctCount === correctOrder.length) {
        handleLevelCompletion(); // If all cups are correct, proceed to the next level
    } else {
        showModal(`${correctCount} out of ${correctOrder.length} cups are correct. Try again!`); // Show feedback modal
    }
}

function getArrangedCups() {
    // Map each cup slot to the background color of the cup inside it, or null if empty
    return [...document.getElementById('arrangement-container').children].map(slot => {
        const cup = slot.querySelector('.cup');
        return cup ? cup.style.backgroundColor : null; // Return the color or null if no cup is present
    });
}

function calculateCorrectCups(arrangedCups) {
    // Compare the arranged cups to the correct order and count the number of correct positions
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
        showModal('Congratulations! You have completed all levels!');
        endGame();
    }
}

function startTimer(seconds) {
    let timeLeft = seconds;
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
    const modal = document.getElementById('modal');
    modal.style.display = 'block';
    document.getElementById('modal-message').innerText = message;

    modal.querySelector('.close').onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}
