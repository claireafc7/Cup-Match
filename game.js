// Game Configuration and State Variables
const levels = [
    { cupCount: 2, timeLimit: 60 },
    { cupCount: 3, timeLimit: 60 },
    { cupCount: 4, timeLimit: 60 },
    { cupCount: 5, timeLimit: 60 },
    { cupCount: 6, timeLimit: 60 },
    { cupCount: 3, timeLimit: 45 },
    { cupCount: 4, timeLimit: 45 },
    { cupCount: 5, timeLimit: 45 },
    { cupCount: 7, timeLimit: 60 },
    { cupCount: 8, timeLimit: 60 },
    { cupCount: 9, timeLimit: 90 },
    { cupCount: 10, timeLimit: 90 },
    { cupCount: 11, timeLimit: 90 },
    { cupCount: 12, timeLimit: 90 },
    { cupCount: 9, timeLimit: 60 },
    { cupCount: 10, timeLimit: 75, duplicateColors: 3 },
    { cupCount: 10, timeLimit: 75, duplicateColors: 5 },
    { cupCount: 11, timeLimit: 75, duplicateColors: 4 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 4 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 6 },
    { cupCount: 12, timeLimit: 100, extraCups: 2 },
    { cupCount: 12, timeLimit: 100, extraCups: 3 },
    { cupCount: 12, timeLimit: 100, extraCups: 5 },
    { cupCount: 12, timeLimit: 100, extraCups: 7 },
    { cupCount: 12, timeLimit: 100, extraCups: 8 },
    { cupCount: 13, timeLimit: 100 },
    { cupCount: 14, timeLimit: 110 },
    { cupCount: 15, timeLimit: 120 },
    { cupCount: 16, timeLimit: 120 },
    { cupCount: 17, timeLimit: 120 },
    { cupCount: 17, timeLimit: 140, extraCups: 2 },
    { cupCount: 17, timeLimit: 140, extraCups: 3 },
    { cupCount: 18, timeLimit: 140 },
    { cupCount: 19, timeLimit: 140 },
    { cupCount: 20, timeLimit: 140 },
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
    shuffledCups = generateCups(totalCups, levelData.cupCount, levelData.duplicateColors || 0, levelData.extraCups || 0);
    correctOrder = shuffledCups.slice(0, levelData.cupCount); // First N cups are the correct order

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.cupCount); // Create slots based on the cup count

    startTimer(levelData.timeLimit);
}

function updateLevelInfo(levelData) {
    document.getElementById('level').innerText = `Level ${currentLevel + 1}`;
    document.getElementById('time-left').innerText = levelData.timeLimit;
}

function generateCups(totalCupCount, actualCupCount, duplicateColors = 0, extraCups = 0) {
    const colors = ["#FF5733",
        "#33FF57", 
        "#3357FF",
        "#FF33A6",
        "#FFFF33",
        "#33FFF5",
        "#A633FF", 
        "#FF8C33", 
        "#FF3333",
        "#8CFF33", 
        "#33FFA2", 
        "#3339FF", 
        "#FFC733", 
        "#33D1FF", 
        "#FF33D6", 
        "#FF5733", 
        "#B833FF", 
        "#33FF8F", 
        "#FF33F6", 
        "#FF9633"];

    // Step 1: Select Colors for the Main Cups
    let selectedColors = colors.slice(0, actualCupCount - duplicateColors);

    // Add duplicate colors
    for (let i = 0; i < duplicateColors; i++) {
        selectedColors.push(selectedColors[Math.floor(Math.random() * selectedColors.length)]);
    }

    // Step 2: Generate Cups for the Main Set
    const cups = [];
    for (let i = 0; i < actualCupCount; i++) {
        cups.push({ color: selectedColors[i % selectedColors.length], id: i });
    }

    // Step 3: Assign Unique Colors for Extra Cups
    if (extraCups > 0) {
        const remainingColors = colors.filter(color => !selectedColors.includes(color)); // Filter out used colors

        for (let i = 0; i < extraCups; i++) {
            if (remainingColors.length === 0) break; // In case we run out of unique colors
            const extraColor = remainingColors.shift(); // Take a unique color
            cups.push({ color: extraColor, id: actualCupCount + i });
        }
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

function createCupSlots(count) {
    const arrangementContainer = document.getElementById('arrangement-container');
    arrangementContainer.innerHTML = ''; // Clear previous slots

    // Disable the check button initially
    const checkButton = document.getElementById('check-arrangement');
    checkButton.disabled = true;

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

    // Check if all slots are filled and enable the check button if true
    checkIfAllSlotsFilled();
}

function checkIfAllSlotsFilled() {
    const slots = document.querySelectorAll('.cup-slot');
    const allFilled = [...slots].every(slot => slot.querySelector('.cup') !== null);

    const checkButton = document.getElementById('check-arrangement');
    checkButton.disabled = !allFilled; // Enable if all slots are filled, otherwise disable
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

    if (touchedElement && touchedElement !== draggedOverElement) {
        draggedOverElement = touchedElement;
    }
}

function touchEnd(event) {
    if (isPaused) return;
    const targetSlot = draggedOverElement.closest('.cup-slot');

    if (targetSlot && selectedCupElement) {
        swapCups(targetSlot);
    }

    selectedCupElement.classList.remove('dragging');
    selectedCupElement = null;
}

// Timer Functions
function startTimer(duration) {
    let timeRemaining = duration;
    const timeDisplay = document.getElementById('time-left');
    timeDisplay.innerText = timeRemaining;

    timerInterval = setInterval(() => {
        if (!isPaused) {
            timeRemaining--;
            timeDisplay.innerText = timeRemaining;

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                endLevel(false);
            }
        }
    }, 1000);
}

function togglePause() {
    isPaused = !isPaused;
    const pauseButton = document.getElementById('pause-game');
    pauseButton.innerText = isPaused ? 'Resume' : 'Pause';

    const overlay = document.getElementById('pause-overlay');
    overlay.style.display = isPaused ? 'block' : 'none';
}

function endGame() {
    clearInterval(timerInterval);
    alert('Game Over! Thanks for playing.');
    switchToPage('home-page');
}

function checkArrangement() {
    const slots = document.querySelectorAll('.cup-slot');
    const isCorrect = correctOrder.every((cup, index) => {
        const cupInSlot = slots[index].querySelector('.cup');
        return cupInSlot && parseInt(cupInSlot.getAttribute('data-cup-id')) === cup.id;
    });

    clearInterval(timerInterval); // Stop the timer
    endLevel(isCorrect);
}

function endLevel(isCorrect) {
    const resultMessage = isCorrect ? 'Correct! Moving to the next level.' : 'Incorrect arrangement. Try again!';
    alert(resultMessage);

    if (isCorrect) {
        currentLevel++;
        if (currentLevel < levels.length) {
            startLevel();
        } else {
            alert('Congratulations! You completed all levels!');
            endGame();
        }
    } else {
        startLevel(); // Restart the same level
    }
}

// Modal and Navigation Functions
function showInstructions() {
    document.getElementById('instructions-modal').style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function switchToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
}

function returnCupToStack(event) {
    const cup = event.target;
    const stackContainer = document.getElementById('stack-container');
    stackContainer.appendChild(cup);
}
