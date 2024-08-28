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
    { cupCount: 10, timeLimit: 75, duplicateColors: 2, extraCupCount: 2 }, // Example level
    { cupCount: 10, timeLimit: 60, duplicateColors: 2, extraCupCount: 2 },
    { cupCount: 12, timeLimit: 75, duplicateColors: 4, extraCupCount: 4 },
    { cupCount: 12, timeLimit: 60, duplicateColors: 4, extraCupCount: 4 },
    { cupCount: 12, timeLimit: 60, duplicateColors: 6, extraCupCount: 6 }
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
    console.log('Setting up event listeners.');

    const startGameButton = document.getElementById('start-game');
    const endGameButton = document.getElementById('end-game');
    const checkArrangementButton = document.getElementById('check-arrangement');
    const pauseGameButton = document.getElementById('pause-game');
    const howToPlayButton = document.getElementById('how-to-play-button');
    const closeHowToPlayButton = document.getElementById('close-how-to-play');

    if (startGameButton) startGameButton.addEventListener('click', startGame);
    if (endGameButton) endGameButton.addEventListener('click', endGame);
    if (checkArrangementButton) checkArrangementButton.addEventListener('click', checkArrangement);
    if (pauseGameButton) pauseGameButton.addEventListener('click', togglePauseGame);
    if (howToPlayButton) howToPlayButton.addEventListener('click', showHowToPlay);
    if (closeHowToPlayButton) closeHowToPlayButton.addEventListener('click', closeHowToPlay);

    console.log('Event listeners setup completed.');
}

function preventPageRefresh() {
    window.addEventListener('beforeunload', (event) => {
        event.preventDefault();
        event.returnValue = ''; // Triggers confirmation dialog on refresh
    });
}

function startGame() {
    console.log('Start game button clicked.');
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
    console.log('Updating level info.');
    document.getElementById('level').innerText = `Level ${currentLevel + 1}`;
    document.getElementById('time-left').innerText = levelData.timeLimit;
}

function generateCups(count, duplicateColors = 0, extraCupCount = 0) {
    console.log('Generating cups.');
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
    console.log('Displaying cups in stack.');
    const stackContainer = document.getElementById('stack-container');
    stackContainer.innerHTML = ''; // Clear previous cups

    cups.forEach(color => {
        const cupElement = createCupElement(color);
        stackContainer.appendChild(cupElement);
    });
}

function createCupSlots(count) {
    console.log('Creating cup slots.');
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
    console.log('Drag start.');
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
    console.log('Touch start.');
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
    console.log('Touch end.');
    if (draggedOverElement && selectedCupElement) {
        swapCups(draggedOverElement);
    }
    clearDragState();
}

// Timer Functions
function startTimer(timeLimit) {
    console.log('Starting timer.');
    const timeLeftElement = document.getElementById('time-left');
    let timeLeft = timeLimit;

    timerInterval = setInterval(() => {
        timeLeft--;
        timeLeftElement.innerText = timeLeft;

        if (timeLeft <= 10) {
            timeLeftElement.classList.add('warning');
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeLeftElement.classList.remove('warning');
            alert('Time\'s up!');
            endGame();
        }
    }, 1000);
}

function togglePauseGame() {
    const pauseButton = document.getElementById('pause-game');
    if (pauseButton.innerText === 'Pause Game') {
        pauseButton.innerText = 'Resume Game';
        clearInterval(timerInterval); // Pause the timer
    } else {
        pauseButton.innerText = 'Pause Game';
        startTimer(parseInt(document.getElementById('time-left').innerText)); // Resume the timer
    }
}

// Game Logic Functions
function checkArrangement() {
    console.log('Checking arrangement.');
    const slots = Array.from(document.querySelectorAll('.cup-slot'));
    const currentArrangement = slots.map(slot => slot.querySelector('.cup')?.style.backgroundColor || null);

    if (JSON.stringify(currentArrangement) === JSON.stringify(correctOrder)) {
        alert('Correct arrangement! Moving to the next level.');
        currentLevel++;
        if (currentLevel >= levels.length) {
            alert('Congratulations! You have completed all levels.');
            endGame();
        } else {
            startLevel();
        }
    } else {
        alert('Incorrect arrangement. Try again!');
    }
}

function endGame() {
    console.log('Ending game.');
    switchToPage('home-page');
    clearInterval(timerInterval);
    currentLevel = 0; // Reset level for next game
}

function switchToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
}

function showHowToPlay() {
    document.getElementById('how-to-play-modal').style.display = 'block';
}

function closeHowToPlay() {
    document.getElementById('how-to-play-modal').style.display = 'none';
}

function returnCupToStack(event) {
    if (event.target.classList.contains('cup')) {
        event.target.parentElement.appendChild(event.target); // Return cup to stack if clicked
    }
}
