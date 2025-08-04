let puzzle = [];
let solution = [];
let errorCount = 0;
let timerInterval;
let startTime;
let selectedCell = null;

// Initialize the game when page loads
window.onload = function() {
  startNewGame();
  addKeyboardSupport();
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

      if (cell !== 0) {
        input.value = cell;
        div.classList.add("prefilled");
        input.disabled = true;
        input.readOnly = true;
      } else {
        input.addEventListener("input", onInput);
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

function onInput(e) {
  const val = e.target.value;
  const isPencil = document.getElementById("pencilToggle").checked;

  // Clear any previous styling
  e.target.classList.remove('correct', 'incorrect', 'pencil');

  if (!/^[1-9]$/.test(val)) {
    e.target.value = '';
    return;
  }

  const r = parseInt(e.target.dataset.row);
  const c = parseInt(e.target.dataset.col);
  const correct = solution[r][c];

  if (!isPencil) {
    if (parseInt(val) !== correct) {
      e.target.classList.add('incorrect');
      errorCount++;
      updateErrorCount();

      // Clear incorrect value after animation
      setTimeout(() => {
        if (e.target.classList.contains('incorrect')) {
          e.target.value = '';
          e.target.classList.remove('incorrect');
        }
      }, 1000);
    } else {
      e.target.classList.add('correct');
      e.target.disabled = true;
      e.target.readOnly = true;
      checkCompletion();
    }
  } else {
    e.target.classList.add('pencil');
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
      showCompletionMessage();
    }, 500);
  }
}

function showCompletionMessage() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  alert(`🎉 Congratulations! 🎉\n\nPuzzle completed in ${timeStr}\nErrors: ${errorCount}\n\nStarting new game...`);
  startNewGame();
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

function addKeyboardSupport() {
  document.addEventListener('keydown', (e) => {
    if (!selectedCell || selectedCell.disabled) return;

    const key = e.key;

    // Number input
    if (/^[1-9]$/.test(key)) {
      selectedCell.value = key;
      onInput({ target: selectedCell });
    }

    // Delete/Backspace
    if (key === 'Delete' || key === 'Backspace') {
      selectedCell.value = '';
      selectedCell.classList.remove('correct', 'incorrect', 'pencil');
    }

    // Arrow key navigation
    const row = parseInt(selectedCell.dataset.row);
    const col = parseInt(selectedCell.dataset.col);
    let newRow = row, newCol = col;

    switch(key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(8, row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(8, col + 1);
        break;
    }

    if (newRow !== row || newCol !== col) {
      const newCell = document.querySelector(`input[data-row="${newRow}"][data-col="${newCol}"]`);
      if (newCell && !newCell.disabled) {
        newCell.focus();
        selectCell(newCell);
      }
    }
  });
}

// Additional game functions
function getHint() {
  if (!selectedCell || selectedCell.disabled) {
    alert('Please select an empty cell first!');
    return;
  }

  const row = parseInt(selectedCell.dataset.row);
  const col = parseInt(selectedCell.dataset.col);
  const correctValue = solution[row][col];

  selectedCell.value = correctValue;
  selectedCell.classList.add('correct');
  selectedCell.disabled = true;
  selectedCell.readOnly = true;

  checkCompletion();
}

function clearCell() {
  if (!selectedCell || selectedCell.disabled) {
    alert('Please select an editable cell first!');
    return;
  }

  selectedCell.value = '';
  selectedCell.classList.remove('correct', 'incorrect', 'pencil');
}

function validateBoard() {
  let hasErrors = false;
  const inputs = document.querySelectorAll('#sudoku-board input:not([disabled])');

  inputs.forEach(input => {
    if (input.value !== '') {
      const row = parseInt(input.dataset.row);
      const col = parseInt(input.dataset.col);
      const correctValue = solution[row][col];

      if (parseInt(input.value) !== correctValue) {
        input.classList.add('incorrect');
        hasErrors = true;
        setTimeout(() => {
          input.classList.remove('incorrect');
        }, 2000);
      }
    }
  });

  if (!hasErrors) {
    alert('All current entries are correct! Keep going!');
  } else {
    alert('Some entries are incorrect. They are highlighted in red.');
  }
}
