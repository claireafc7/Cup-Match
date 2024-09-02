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

    // Randomize the correct order
    correctOrder = shuffleArray([...shuffledCups].slice(0, levelData.cupCount));

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.cupCount);

    startTimer(levelData.timeLimit);
}

function updateLevelInfo(levelData) {
    document.getElementById('level').innerText = `Level ${currentLevel + 1}`;
    document.getElementById('time-left').innerText = levelData.timeLimit;
}

function generateCups(totalCupCount, actualCupCount, duplicateColors = 0, extraCups = 0) {
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A6", "#FFFF33", "#33FFF5",
        "#A633FF", "#FF8C33", "#FF3333", "#8CFF33", "#33FFA2", "#3339FF",
        "#FFC733", "#33D1FF", "#FF33D6", "#FF5733", "#B833FF", "#33FF8F",
        "#FF33F6", "#FF9633"];

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
    if (isPaused) return;
    event.preventDefault();
    if (selectedCupElement) {
        const slot = event.target.closest('.cup-slot');
        if (slot && !slot.querySelector('.cup')) {
            slot.appendChild(selectedCupElement);
            document.getElementById('check-arrangement').disabled = false; // Enable button when a cup is placed
        }
    }
}

// Touch Events Functions for Mobile
function touchStart(event) {
    if (isPaused) return;
    event.preventDefault();
    const touch = event.touches[0];
    selectedCupElement = touch.target;
    selectedCupElement.classList.add('dragging');
}

function touchMove(event) {
    if (isPaused) return;
    event.preventDefault();
    const touch = event.touches[0];
    if (selectedCupElement) {
        selectedCupElement.style.position = 'absolute';
        selectedCupElement.style.left = `${touch.clientX - selectedCupElement.offsetWidth / 2}px`;
        selectedCupElement.style.top = `${touch.clientY - selectedCupElement.offsetHeight / 2}px`;
    }
}

function touchEnd(event) {
    if (isPaused) return;
    event.preventDefault();
    if (selectedCupElement) {
        const slot = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
        if (slot && slot.classList.contains('cup-slot') && !slot.querySelector('.cup')) {
            slot.appendChild(selectedCupElement);
            document.getElementById('check-arrangement').disabled = false; // Enable button when a cup is placed
        }
        selectedCupElement.classList.remove('dragging');
        selectedCupElement.style.position = '';
        selectedCupElement = null;
    }
}

function returnCupToStack(event) {
    if (isPaused) return;
    const cupElement = event.target;
    if (cupElement.classList.contains('cup')) {
        const stackContainer = document.getElementById('stack-container');
        stackContainer.appendChild(cupElement);
        document.getElementById('check-arrangement').disabled = true; // Disable button if cups are moved back to the stack
    }
}

function startTimer(duration) {
    let timer = duration;
    const timerDisplay = document.getElementById('time-left');
    timerInterval = setInterval(() => {
        if (isPaused) return;
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        timerDisplay.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (--timer < 0) {
            clearInterval(timerInterval);
            alert('Time is up! Game over.');
            endGame();
        }
    }, 1000);
}

function togglePause() {
    isPaused = !isPaused;
    const pauseOverlay = document.getElementById('pause-overlay');
    pauseOverlay.style.display = isPaused ? 'block' : 'none';
    document.getElementById('check-arrangement').disabled = isPaused; // Disable button during pause
}

function showInstructions() {
    document.getElementById('instructions-modal').style.display = 'block';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function checkArrangement() {
    const slots = document.querySelectorAll('.cup-slot');
    const isCorrect = correctOrder.every((cup, index) => {
        const cupInSlot = slots[index].querySelector('.cup');
        return cupInSlot && parseInt(cupInSlot.getAttribute('data-cup-id')) === cup.id;
    });

    clearInterval(timerInterval);
    showResultModal(isCorrect);
}

function showResultModal(isCorrect) {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');

    modalMessage.innerText = isCorrect ? 'Correct! Moving to the next level.' : 'Incorrect arrangement. Try again!';
    modal.style.display = 'block';

    if (isCorrect) {
        currentLevel++;
        if (currentLevel < levels.length) {
            setTimeout(() => {
                closeModal(modal);
                startLevel();
            }, 2000); // Delay to show the message before starting the next level
        } else {
            alert('Congratulations! You completed all levels!');
            endGame();
        }
    } else {
        setTimeout(() => {
            closeModal(modal);
            startLevel(); // Restart the same level
        }, 2000); // Delay before restarting the level
    }
}

function endGame() {
    switchToPage('main-page');
    currentLevel = 0; // Reset the game state
}

function switchToPage(pageId) {
    document.getElementById('main-page').style.display = pageId === 'main-page' ? 'block' : 'none';
    document.getElementById('game-page').style.display = pageId === 'game-page' ? 'block' : 'none';
}
