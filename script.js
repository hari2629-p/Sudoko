let puzzle = [];
let solution = [];
let errorCount = 0;
let timerInterval;
let startTime;
let selectedCell = null;

// Initialize the game when page loads
window.onload = function() {
  startNewGame();
  disableKeyboardInput();
};

function startNewGame() {
  // Clear any existing timer
  clearInterval(timerInterval);

  // Generate new puzzle
  puzzle = generatePuzzle();
  solution = [...puzzle.solution];
  renderBoard(puzzle.board);

  // Reset game state
  errorCount = 0;
  updateErrorCount();
  startTimer();

  // Clear selection
  selectedCell = null;

  // Hide modal if visible
  document.getElementById('completion-modal').style.display = 'none';
}

function generatePuzzle() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillDiagonalBlocks(board);
  solveSudoku(board);
  const fullSolution = board.map(row => [...row]);

  const difficulty = document.getElementById("difficulty")?.value || "medium";
  let cellsToRemove = 40;
  if (difficulty === "easy") cellsToRemove = 35;
  else if (difficulty === "hard") cellsToRemove = 55;

  removeCells(board, cellsToRemove);
  return { board, solution: fullSolution };
}

function fillDiagonalBlocks(board) {
  for (let i = 0; i < 9; i += 3) {
    fillBlock(board, i, i);
  }
}

function fillBlock(board, row, col) {
  let nums = shuffle([1,2,3,4,5,6,7,8,9]);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      board[row + i][col + j] = nums[i * 3 + j];
    }
  }
}

function shuffle(arr) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function isSafe(board, row, col, num) {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = row - row % 3;
  const startCol = col - col % 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
}

function solveSudoku(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isSafe(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function removeCells(board, count) {
  while (count > 0) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    if (board[row][col] !== 0) {
      board[row][col] = 0;
      count--;
    }
  }
}

function renderBoard(boardData) {
  const boardEl = document.getElementById("sudoku-board");
  boardEl.innerHTML = '';

  boardData.forEach((row, r) => {
    row.forEach((cell, c) => {
      const div = document.createElement("div");
      div.className = "cell";
      div.dataset.row = r;
      div.dataset.col = c;

      const input = document.createElement("input");
      input.maxLength = 1;
      input.dataset.row = r;
      input.dataset.col = c;
      input.type = "text";
      input.readOnly = true;
      input.style.caretColor = "transparent";

      if (cell !== 0) {
        input.value = cell;
        div.classList.add("prefilled");
        input.disabled = true;
      } else {
        input.addEventListener("click", onCellClick);
        input.addEventListener("focus", onCellFocus);
      }

      div.appendChild(input);
      boardEl.appendChild(div);
    });
  });
}

function onCellClick(e) {
  selectCell(e.target);
}

function onCellFocus(e) {
  selectCell(e.target);
}

function selectCell(input) {
  // Clear previous selection
  document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('selected', 'highlight-row', 'highlight-col', 'highlight-box');
  });

  selectedCell = input;
  const row = parseInt(input.dataset.row);
  const col = parseInt(input.dataset.col);

  // Highlight selected cell
  input.parentElement.classList.add('selected');

  // Highlight row, column, and 3x3 box
  document.querySelectorAll('.cell').forEach(cell => {
    const cellRow = parseInt(cell.dataset.row);
    const cellCol = parseInt(cell.dataset.col);

    if (cellRow === row) {
      cell.classList.add('highlight-row');
    }
    if (cellCol === col) {
      cell.classList.add('highlight-col');
    }
    if (Math.floor(cellRow / 3) === Math.floor(row / 3) &&
        Math.floor(cellCol / 3) === Math.floor(col / 3)) {
      cell.classList.add('highlight-box');
    }
  });
}

// Handle number pad input
function handlePadInput(value) {
  if (!selectedCell || selectedCell.disabled) {
    showMessage('Please select an empty cell first!', 'warning');
    return;
  }

  if (value === 'clear') {
    clearCell();
    return;
  }

  const isPencil = document.getElementById("pencilToggle").checked;

  // Clear any previous styling
  selectedCell.classList.remove('correct', 'incorrect', 'pencil');
  selectedCell.value = value;

  const r = parseInt(selectedCell.dataset.row);
  const c = parseInt(selectedCell.dataset.col);
  const correct = solution[r][c];

  if (!isPencil) {
    if (parseInt(value) !== correct) {
      selectedCell.classList.add('incorrect');
      errorCount++;
      updateErrorCount();

      // Clear incorrect value after animation
      setTimeout(() => {
        if (selectedCell && selectedCell.classList.contains('incorrect')) {
          selectedCell.value = '';
          selectedCell.classList.remove('incorrect');
        }
      }, 1500);
    } else {
      selectedCell.classList.add('correct');
      selectedCell.disabled = true;
      selectedCell.readOnly = true;

      // Add subtle success effect
      setTimeout(() => {
        checkCompletion();
      }, 100);
    }
  } else {
    selectedCell.classList.add('pencil');
  }
}

function updateErrorCount() {
  document.getElementById("errors").textContent = errorCount;
}

function checkCompletion() {
  const inputs = document.querySelectorAll('#sudoku-board input:not([disabled])');
  let allCorrect = true;

  for (let input of inputs) {
    if (input.value === '' || input.classList.contains('pencil')) {
      allCorrect = false;
      break;
    }
    const r = parseInt(input.dataset.row);
    const c = parseInt(input.dataset.col);
    if (parseInt(input.value) !== solution[r][c]) {
      allCorrect = false;
      break;
    }
  }

  if (allCorrect) {
    clearInterval(timerInterval);
    setTimeout(() => {
      showCompletionModal();
    }, 800);
  }
}

function showCompletionModal() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  document.getElementById('final-time').textContent = timeStr;
  document.getElementById('final-errors').textContent = errorCount;
  document.getElementById('completion-modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('completion-modal').style.display = 'none';
  startNewGame();
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('completion-modal');
  if (event.target === modal) {
    closeModal();
  }
}

function startTimer() {
  clearInterval(timerInterval);
  startTime = Date.now();

  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    document.getElementById("timer").textContent = `${minutes}:${seconds}`;
  }, 1000);
}

// Disable all keyboard input to cells
function disableKeyboardInput() {
  document.addEventListener('keydown', (e) => {
    // Only allow specific navigation keys
    const allowedKeys = ['Tab', 'Escape'];

    if (selectedCell && !selectedCell.disabled) {
      // Arrow key navigation
      const row = parseInt(selectedCell.dataset.row);
      const col = parseInt(selectedCell.dataset.col);
      let newRow = row, newCol = col;

      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newRow = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newRow = Math.min(8, row + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newCol = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newCol = Math.min(8, col + 1);
          break;
        case 'Escape':
          selectedCell.blur();
          selectedCell = null;
          document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'highlight-row', 'highlight-col', 'highlight-box');
          });
          return;
        default:
          // Block all other keys including numbers
          if (!allowedKeys.includes(e.key)) {
            e.preventDefault();
          }
          return;
      }

      if (newRow !== row || newCol !== col) {
        const newCell = document.querySelector(`input[data-row="${newRow}"][data-col="${newCol}"]`);
        if (newCell && !newCell.disabled) {
          newCell.focus();
          selectCell(newCell);
        }
      }
    } else {
      // Block number keys even when no cell is selected
      if (/^[0-9]$/.test(e.key) || /^[1-9]$/.test(e.key)) {
        e.preventDefault();
      }
    }
  });

  // Prevent paste operations
  document.addEventListener('paste', (e) => {
    e.preventDefault();
  });

  // Prevent input events on all inputs
  document.addEventListener('input', (e) => {
    if (e.target.matches('#sudoku-board input')) {
      e.preventDefault();
      e.target.value = '';
    }
  });
}

// Additional game functions
function getHint() {
  if (!selectedCell || selectedCell.disabled) {
    showMessage('Please select an empty cell first!', 'warning');
    return;
  }

  const row = parseInt(selectedCell.dataset.row);
  const col = parseInt(selectedCell.dataset.col);
  const correctValue = solution[row][col];

  selectedCell.value = correctValue;
  selectedCell.classList.add('correct');
  selectedCell.disabled = true;
  selectedCell.readOnly = true;

  // Add hint effect
  selectedCell.style.animation = 'hintGlow 1s ease-out';
  setTimeout(() => {
    if (selectedCell) {
      selectedCell.style.animation = '';
    }
  }, 1000);

  checkCompletion();
}

function clearCell() {
  if (!selectedCell || selectedCell.disabled) {
    showMessage('Please select an editable cell first!', 'warning');
    return;
  }

  selectedCell.value = '';
  selectedCell.classList.remove('correct', 'incorrect', 'pencil');
}

function validateBoard() {
  let hasErrors = false;
  const inputs = document.querySelectorAll('#sudoku-board input:not([disabled])');

  if (inputs.length === 0) {
    showMessage('Puzzle is already complete!', 'success');
    return;
  }

  inputs.forEach(input => {
    if (input.value !== '' && !input.classList.contains('pencil')) {
      const row = parseInt(input.dataset.row);
      const col = parseInt(input.dataset.col);
      const correctValue = solution[row][col];

      if (parseInt(input.value) !== correctValue) {
        input.classList.add('incorrect');
        hasErrors = true;
        setTimeout(() => {
          input.classList.remove('incorrect');
        }, 2500);
      }
    }
  });

  if (!hasErrors) {
    showMessage('All current entries are correct! Keep going!', 'success');
  } else {
    showMessage('Some entries are incorrect. They are highlighted in red.', 'error');
  }
}

// Enhanced message system
function showMessage(text, type = 'info') {
  // Remove existing messages
  const existingMessage = document.querySelector('.game-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  const message = document.createElement('div');
  message.className = `game-message ${type}`;
  message.textContent = text;

  // Style the message
  Object.assign(message.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '15px 25px',
    borderRadius: '10px',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '1rem',
    zIndex: '1000',
    opacity: '0',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)'
  });

  // Set background based on type
  switch(type) {
    case 'success':
      message.style.background = 'linear-gradient(145deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))';
      message.style.border = '1px solid rgba(34, 197, 94, 0.5)';
      break;
    case 'error':
      message.style.background = 'linear-gradient(145deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))';
      message.style.border = '1px solid rgba(239, 68, 68, 0.5)';
      break;
    case 'warning':
      message.style.background = 'linear-gradient(145deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9))';
      message.style.border = '1px solid rgba(251, 191, 36, 0.5)';
      message.style.color = '#1a1a1a';
      break;
    default:
      message.style.background = 'linear-gradient(145deg, rgba(64, 64, 64, 0.9), rgba(42, 42, 42, 0.9))';
      message.style.border = '1px solid rgba(96, 96, 96, 0.5)';
  }

  document.body.appendChild(message);

  // Animate in
  setTimeout(() => {
    message.style.opacity = '1';
    message.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);

  // Animate out
  setTimeout(() => {
    message.style.opacity = '0';
    message.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 300);
  }, 3000);
}

// Add CSS for hint glow animation
const style = document.createElement('style');
style.textContent = `
  @keyframes hintGlow {
    0% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.5); }
    50% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.8), 0 0 30px rgba(251, 191, 36, 0.6); }
    100% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.3); }
  }
`;
document.head.appendChild(style);
