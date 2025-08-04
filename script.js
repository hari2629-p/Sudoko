let puzzle = [];
let solution = [];
let errorCount = 0;
let timerInterval;
let startTime;

function startNewGame() {
  puzzle = generatePuzzle();
  solution = [...puzzle.solution];
  renderBoard(puzzle.board);
  errorCount = 0;
  document.getElementById("errors").innerText = "Errors: 0";
  startTimer();
}

function generatePuzzle() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillDiagonalBlocks(board);
  solveSudoku(board);
  const fullSolution = board.map(row => [...row]);
  removeCells(board, 40); // remove 40 cells for medium difficulty
  return { board, solution: fullSolution };
}

function fillDiagonalBlocks(board) {
  for (let i = 0; i < 9; i += 3) {
    fillBlock(board, i, i);
  }
}

function fillBlock(board, row, col) {
  let nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      board[row + i][col + j] = nums.pop();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isSafe(board, row, col, num) {
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num || board[x][col] === num) return false;
    if (board[3 * Math.floor(row / 3) + Math.floor(x / 3)]
             [3 * Math.floor(col / 3) + x % 3] === num) return false;
  }
  return true;
}

function solveSudoku(board) {
  for (let row = 0; row < 9; row++)
    for (let col = 0; col < 9; col++)
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

      const input = document.createElement("input");
      input.maxLength = 1;
      input.dataset.row = r;
      input.dataset.col = c;

      if (cell !== 0) {
        input.value = cell;
        div.classList.add("prefilled");
        input.disabled = true;
      } else {
        input.addEventListener("input", onInput);
      }

      div.appendChild(input);
      boardEl.appendChild(div);
    });
  });
}

function onInput(e) {
  const val = e.target.value;
  const isPencil = document.getElementById("pencilToggle").checked;

  if (!/^[1-9]$/.test(val)) {
    e.target.value = '';
    return;
  }

  const r = parseInt(e.target.dataset.row);
  const c = parseInt(e.target.dataset.col);
  const correct = solution[r][c];

  if (!isPencil) {
    if (parseInt(val) !== correct) {
      e.target.style.color = 'red';
      errorCount++;
      document.getElementById("errors").innerText = `Errors: ${errorCount}`;
    } else {
      e.target.style.color = 'green';
      e.target.disabled = true;
      checkCompletion();
    }
  } else {
    e.target.style.fontSize = '0.8rem';
    e.target.style.color = '#888';
  }
}

function checkCompletion() {
  const inputs = document.querySelectorAll('#sudoku-board input:not([disabled])');
  for (let input of inputs) {
    const r = parseInt(input.dataset.row);
    const c = parseInt(input.dataset.col);
    if (parseInt(input.value) !== solution[r][c]) {
      return;
    }
  }

  setTimeout(() => {
    alert('🎉 Puzzle Completed! Generating new puzzle...');
    startNewGame();
  }, 300);
}

function startTimer() {
  clearInterval(timerInterval);
  startTime = Date.now();

  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    document.getElementById("timer").innerText = `Time: ${minutes}:${seconds}`;
  }, 1000);
}

window.onload = startNewGame;
