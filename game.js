// Game Logic
const levels = [
    {
        cups: 3, // Number of cups
        extras: 0, // Extra cups not in the correct arrangement
        duplicates: 0, // Duplicate cups in the correct arrangement
        timeLimit: 60, // Time limit for this level
        killerCups: [1] // Indexes of cups that are killer cups (0-based index)
    },
    {
        cups: 4,
        extras: 2,
        duplicates: 1,
        timeLimit: 50,
        killerCups: [2] // Indexes of cups that are killer cups (0-based index)
    },
    {
        cups: 5,
        extras: 3,
        duplicates: 2,
        timeLimit: 40,
        killerCups: [0, 3] // Indexes of cups that are killer cups (0-based index)
    }
];

const colors = [
    'red', 'blue', 'green', 'yellow', 'purple', 'orange',
    'pink', 'cyan', 'magenta', 'lime', 'teal', 'indigo',
    'violet', 'brown', 'gray', 'olive', 'maroon', 'navy',
    'gold', 'silver'
];

let currentLevel = 0;
let correctOrder = [];
let currentOrder = [];
let timeLeft;
let countdownInterval;
let killerCups;

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
        currentLevel = 0; // Ensure starting from the first level
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
        killerCups = levelConfig.killerCups;

        // Create cups and slots based on level configuration
        createCups(levelConfig.cups, levelConfig.extras);
        createSlots(levelConfig.cups);

        levelElement.textContent = `Level ${currentLevel + 1}`;
        timeLeft = levelConfig.timeLimit;
        timeLeftElement.textContent = `${timeLeft} seconds`; // Display time with "seconds"
        checkButton.disabled = true;
    }

    // Create Cups (with extra or duplicate options)
    function createCups(cupCount, extras) {
        let cupColors = correctOrder.slice(); // Start with the correct arrangement

        // Add extra random colors
        for (let i = 0; i < extras; i++) {
            cupColors.push(colors[Math.floor(Math.random() * colors.length)]);
        }

        // Shuffle cupColors array for randomness
        cupColors = cupColors.sort(() => Math.random() - 0.5);

        // Create and append cup elements
        cupColors.forEach((color, index) => {
            const cup = document.createElement('div');
            cup.classList.add('cup', color);
            if (killerCups.includes(index)) {
                cup.classList.add('killer');
            }
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
        const cupElement = Array.from(cupsContainer.children).find(cup => cup.classList.contains(color));

        // Prevent placing more than one cup in a slot
        if (!this.classList.contains('red') && !this.classList.contains('blue') && !this.classList.contains('green') &&
            !this.classList.contains('yellow') && !this.classList.contains('purple') && !this.classList.contains('orange') &&
            !this.classList.contains('pink') && !this.classList.contains('cyan') && !this.classList.contains('magenta') &&
            !this.classList.contains('lime') && !this.classList.contains('teal') && !this.classList.contains('indigo') &&
            !this.classList.contains('violet') && !this.classList.contains('brown') && !this.classList.contains('gray') &&
            !this.classList.contains('olive') && !this.classList.contains('maroon') && !this.classList.contains('navy') &&
            !this.classList.contains('gold') && !this.classList.contains('silver')) {
            this.classList.add(color);
            currentOrder.push(color);

            // Check if all slots are filled
            if (currentOrder.length === correctOrder.length) {
                checkButton.disabled = false; // Enable check button once all slots are filled
            }
        }

        // Check if a killer cup was dropped
        if (cupElement.classList.contains('killer')) {
            showMessage('Game Over! You placed a killer cup.'); // Display message for killer cup
            disableInteraction();
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
            timeLeftElement.textContent = `${timeLeft} seconds`; // Display time with "seconds"

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


