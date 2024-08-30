// Game Logic
const levels = [
    {
        cups: 3, // Number of cups
        extras: 0, // Extra cups not in the correct arrangement
        duplicates: 0, // Duplicate cups in the correct arrangement
        timeLimit: 60, // Time limit for this level
    },
    {
        cups: 4,
        extras: 2,
        duplicates: 1,
        timeLimit: 50,
    },
    {
        cups: 5,
        extras: 3,
        duplicates: 2,
        timeLimit: 40,
    }
];

let currentLevel = 0;
let correctOrder = [];
let currentOrder = [];
let timeLeft;
let countdownInterval;

document.addEventListener('DOMContentLoaded', () => {
    const cupsContainer = document.getElementById('stack-container');
    const slotsContainer = document.getElementById('arrangement-container');
    const checkButton = document.getElementById('check-arrangement');
    const timeLeftElement = document.getElementById('time-left');
    const levelElement = document.getElementById('level');
    const startGameButton = document.getElementById('start-game');
    const gamePage = document.getElementById('game-page');
    const homePage = document.getElementById('home-page');
    const modal = document.getElementById('modal');
    const modalCloseButton = document.getElementById('modal-close');

    startGameButton.addEventListener('click', startGame);

    modalCloseButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Start Game Function
    function startGame() {
        homePage.style.display = 'none';
        gamePage.style.display = 'block';
        setupLevel();
        startTimer();
    }

    // Setup Level
    function setupLevel() {
        const levelConfig = levels[currentLevel];
        correctOrder = generateRandomArrangement(levelConfig.cups, levelConfig.duplicates);
        currentOrder = [];
        cupsContainer.innerHTML = '';
        slotsContainer.innerHTML = '';

        // Create cups and slots based on level configuration
        createCups(levelConfig.cups, levelConfig.extras);
        createSlots(levelConfig.cups);

        levelElement.textContent = `Level ${currentLevel + 1}`;
        timeLeft = levelConfig.timeLimit;
        timeLeftElement.textContent = timeLeft;
        checkButton.disabled = true;
    }

    // Create Cups (with extra or duplicate options)
    function createCups(cupCount, extras) {
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        let cupColors = correctOrder.slice(); // Start with the correct arrangement

        // Add extra random colors
        for (let i = 0; i < extras; i++) {
            cupColors.push(colors[Math.floor(Math.random() * colors.length)]);
        }

        // Shuffle cupColors array for randomness
        cupColors = cupColors.sort(() => Math.random() - 0.5);

        // Create and append cup elements
        cupColors.forEach(color => {
            const cup = document.createElement('div');
            cup.classList.add('cup', color);
            cup.setAttribute('draggable', true);
            cupsContainer.appendChild(cup);

            cup.addEventListener('dragstart', handleDragStart);
            cup.addEventListener('dragend', handleDragEnd);
        });
    }

    // Create Slots
    function createSlots(slotCount) {
        for (let i = 0; i < slotCount; i++) {
            const slot = document.createElement('div');
            slot.classList.add('cup-slot');
            slotsContainer.appendChild(slot);

            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('drop', handleDrop);
        }
    }

    // Generate Random Arrangement
    function generateRandomArrangement(cupCount, duplicates) {
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        let arrangement = [];

        for (let i = 0; i < cupCount - duplicates; i++) {
            arrangement.push(colors[Math.floor(Math.random() * colors.length)]);
        }

        // Add duplicate cups
        for (let i = 0; i < duplicates; i++) {
            arrangement.push(arrangement[Math.floor(Math.random() * arrangement.length)]);
        }

        // Shuffle and return the arrangement
        return arrangement.sort(() => Math.random() - 0.5);
    }

    // Drag and Drop Logic
    function handleDragStart(e) {
        e.dataTransfer.setData('color', this.classList[1]); // Get the color class (e.g., 'red', 'blue')
        this.classList.add('dragging');
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault(); // Necessary to allow dropping
    }

    function handleDrop(e) {
        e.preventDefault();
        const color = e.dataTransfer.getData('color');
        
        // Prevent placing more than one cup in a slot
        if (!this.classList.contains('red') && !this.classList.contains('blue') && !this.classList.contains('green') &&
            !this.classList.contains('yellow') && !this.classList.contains('purple') && !this.classList.contains('orange')) {
            this.classList.add(color);
            currentOrder.push(color);
        }

        // Check if all slots are filled
        if (currentOrder.length === correctOrder.length) {
            checkButton.disabled = false; // Enable check button once all slots are filled
        }
    }

    function checkArrangement() {
        let correctCount = 0;

        // Compare current order with correct order
        for (let i = 0; i < correctOrder.length; i++) {
            const slot = slotsContainer.children[i];
            if (currentOrder[i] === correctOrder[i]) {
                slot.classList.add('correct');
                correctCount++;
            } else {
                slot.classList.add('incorrect');
            }
        }

        if (correctCount === correctOrder.length) {
            showMessage(`Congratulations! All ${correctCount} cups are correct. Moving to the next level.`);
            currentLevel++;
            if (currentLevel < levels.length) {
                setTimeout(setupLevel, 2000); // Move to next level after a brief delay
            } else {
                showMessage('You completed all levels! Well done!');
                disableInteraction();
            }
        } else {
            showMessage(`${correctCount} out of ${correctOrder.length} cups are correct. Try again!`);
        }
    }

    function startTimer() {
        countdownInterval = setInterval(() => {
            timeLeft--;
            timeLeftElement.textContent = timeLeft;

            if (timeLeft <= 10) {
                timeLeftElement.classList.add('warning');
            }

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                showMessage('Time\'s up! Game over.');
                disableInteraction();
            }
        }, 1000);
    }

    function disableInteraction() {
        const cups = document.querySelectorAll('.cup');
        cups.forEach(cup => {
            cup.setAttribute('draggable', false);
        });
        checkButton.disabled = true;
    }

    function showMessage(message) {
        modal.querySelector('p').textContent = message;
        modal.style.display = 'block';
    }
});
