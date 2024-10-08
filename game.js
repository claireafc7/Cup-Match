const levels = [
    { cupCount: 2, timeLimit: 60 },
    { cupCount: 3, timeLimit: 60 },
    { cupCount: 4, timeLimit: 60 },
    { cupCount: 5, timeLimit: 60 },
    { cupCount: 6, timeLimit: 60 },
    { cupCount: 3, timeLimit: 45 },
    { cupCount: 4, timeLimit: 45 },
    { cupCount: 5, timeLimit: 45 },
    { cupCount: 7, timeLimit: 90 },
    { cupCount: 8, timeLimit: 90 },
    { cupCount: 9, timeLimit: 90 },
    { cupCount: 10, timeLimit: 120 },
    { cupCount: 11, timeLimit: 120 },
    { cupCount: 12, timeLimit: 120 },
    { cupCount: 9, timeLimit: 75 },
    { cupCount: 10, timeLimit: 100, duplicateColors: 3 },
    { cupCount: 10, timeLimit: 100, duplicateColors: 5 },
    { cupCount: 11, timeLimit: 100, duplicateColors: 4 },
    { cupCount: 12, timeLimit: 100, duplicateColors: 4 },
    { cupCount: 12, timeLimit: 100, duplicateColors: 6 },
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
    { cupCount: 20, timeLimit: 140 }
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
    shuffledCups = generateCups(totalCups, levelData.cupCount, levelData.duplicateColors || 0);
    correctOrder = shuffledCups.slice(0, levelData.cupCount); // First N cups are the correct order

    displayCupsInStack(shuffledCups);
    createCupSlots(levelData.cupCount); // Create slots based on the cup count

    startTimer(levelData.timeLimit);
}

function updateLevelInfo(levelData) {
    const levelElement = document.getElementById('level');
    levelElement.innerText = `Level ${currentLevel + 1}`;

    // Ensure that the level number fits within its container
    levelElement.classList.remove('level-overflow');
    if (levelElement.scrollWidth > levelElement.clientWidth) {
        levelElement.classList.add('level-overflow');
    }
}

function generateCups(totalCupCount, actualCupCount, duplicateColors = 0) {
    const colors = ["#F5AF93",
"#80FA06",
"#394073",
"#F7AFFF",
"#A768AC",
"#E254C7",
"#0624A2",
"#B3AC4D",
"#F90101",
"#2E2E2E",
"#8ABA5A",
"#65E5FF",
"#000000",
"#E51B1B",
"#6B3D6F",
"#565656",
"#D17A05",
"#28EC8F",
"#008CA8",
"#FFFFFF"  
       
        
        
    ];

    const allColors = [...colors];
    const selectedColors = allColors.slice(0, actualCupCount - duplicateColors);

    // Generate cups with duplicate colors
    const cups = [];
    for (let i = 0; i < actualCupCount; i++) {
        cups.push({ color: selectedColors[i % selectedColors.length], id: i });
    }

    // Add extra cups with unique colors
    const uniqueColors = allColors.filter(color => !selectedColors.includes(color));
    for (let i = 0; i < totalCupCount - actualCupCount; i++) {
        if (uniqueColors.length === 0) break; // If we run out of unique colors
        cups.push({ color: uniqueColors[i % uniqueColors.length], id: actualCupCount + i });
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
    return [...document.getElementById('arrangement-container').children].map(slot => {
        const cup = slot.querySelector('.cup');
        return cup ? cup.style.backgroundColor : null;
    });
}

function calculateCorrectCups(arrangedCups) {
    return arrangedCups.reduce((count, color, index) => {
        const cupId = document.querySelector(`[data-cup-id="${index}"]`)?.style.backgroundColor;
        return count + (color === cupId ? 1 : 0);
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