const SIZE = 15;
const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
let currentPlayer = 'X'; // Người luôn là X
let gameOver = false;

const boardDiv = document.getElementById('game-board');
const statusDiv = document.getElementById('status');
const restartBtn = document.getElementById('restart-btn');

function renderBoard() {
    boardDiv.innerHTML = '';
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell' + (board[i][j] ? ' ' + board[i][j].toLowerCase() : '');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.textContent = board[i][j];
            cell.onclick = () => handleCellClick(i, j);
            boardDiv.appendChild(cell);
        }
    }
}

function handleCellClick(row, col) {
    if (gameOver || board[row][col]) return;
    board[row][col] = 'X';
    renderBoard();
    if (checkWin(row, col, 'X')) {
        statusDiv.textContent = 'Bạn thắng!';
        gameOver = true;
        return;
    }
    if (isBoardFull()) {
        statusDiv.textContent = 'Hòa!';
        gameOver = true;
        return;
    }
    statusDiv.textContent = 'Đến lượt AI...';
    setTimeout(aiMove, 500);
}

function aiMove() {
    // AI dùng thuật toán minimax
    let best = minimax(board, 2, true, -Infinity, Infinity);
    let [row, col] = best.move || findRandomMove();
    board[row][col] = 'O';
    renderBoard();
    if (checkWin(row, col, 'O')) {
        statusDiv.textContent = 'AI thắng!';
        gameOver = true;
        return;
    }
    if (isBoardFull()) {
        statusDiv.textContent = 'Hòa!';
        gameOver = true;
        return;
    }
    statusDiv.textContent = 'Đến lượt bạn!';

// Tìm nước đi ngẫu nhiên nếu minimax không có
function findRandomMove() {
    let emptyCells = [];
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            if (!board[i][j]) emptyCells.push([i, j]);
        }
    }
    return emptyCells[Math.floor(Math.random() * emptyCells.length)] || [0, 0];
}

// Minimax với alpha-beta pruning
function minimax(bd, depth, isAI, alpha, beta) {
    let winner = getWinner(bd);
    if (winner === 'O') return { score: 10000 - depth };
    if (winner === 'X') return { score: -10000 + depth };
    if (isBoardFullCustom(bd) || depth === 0) {
        return { score: evaluateBoard(bd) };
    }
    let bestMove = null;
    if (isAI) {
        let maxEval = -Infinity;
        for (const [i, j] of getCandidateMoves(bd)) {
            bd[i][j] = 'O';
            let eval = minimax(bd, depth - 1, false, alpha, beta).score;
            bd[i][j] = '';
            if (eval > maxEval) {
                maxEval = eval;
                bestMove = [i, j];
            }
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return { score: maxEval, move: bestMove };
    } else {
        let minEval = Infinity;
        for (const [i, j] of getCandidateMoves(bd)) {
            bd[i][j] = 'X';
            let eval = minimax(bd, depth - 1, true, alpha, beta).score;
            bd[i][j] = '';
            if (eval < minEval) {
                minEval = eval;
                bestMove = [i, j];
            }
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return { score: minEval, move: bestMove };
    }
}

// Lấy danh sách các ô trống gần quân đã đánh
function getCandidateMoves(bd) {
    let moves = new Set();
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            if (bd[i][j]) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        let ni = i + dx, nj = j + dy;
                        if (ni >= 0 && ni < SIZE && nj >= 0 && nj < SIZE && !bd[ni][nj]) {
                            moves.add(ni + ',' + nj);
                        }
                    }
                }
            }
        }
    }
    if (moves.size === 0) {
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                if (!bd[i][j]) moves.add(i + ',' + j);
            }
        }
    }
    return Array.from(moves).map(s => s.split(',').map(Number));
}

// Đánh giá bàn cờ cho minimax
function evaluateBoard(bd) {
    let score = 0;
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            if (!bd[i][j]) continue;
            score += (bd[i][j] === 'O' ? 1 : -1) * (evaluateMoveCustom(bd, i, j, bd[i][j]));
        }
    }
    return score;
}

function evaluateMoveCustom(bd, row, col, player) {
    let score = 0;
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];
    for (const [dx, dy] of directions) {
        let count = 1;
        let block = 0;
        for (let d = 1; d < 5; d++) {
            let r = row + dx * d, c = col + dy * d;
            if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) { block++; break; }
            if (bd[r][c] === player) count++;
            else if (bd[r][c]) { block++; break; }
            else break;
        }
        for (let d = 1; d < 5; d++) {
            let r = row - dx * d, c = col - dy * d;
            if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) { block++; break; }
            if (bd[r][c] === player) count++;
            else if (bd[r][c]) { block++; break; }
            else break;
        }
        if (count >= 5) score += 10000;
        else if (count === 4 && block === 0) score += 1000;
        else if (count === 4 && block === 1) score += 200;
        else if (count === 3 && block === 0) score += 100;
        else if (count === 3 && block === 1) score += 30;
        else if (count === 2 && block === 0) score += 10;
    }
    return score;
}

function getWinner(bd) {
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            if (bd[i][j] && checkWinCustom(bd, i, j, bd[i][j])) return bd[i][j];
        }
    }
    return null;
}

function checkWinCustom(bd, row, col, player) {
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];
    for (const [dx, dy] of directions) {
        let count = 1;
        for (let d = 1; d < 5; d++) {
            let r = row + dx * d, c = col + dy * d;
            if (r < 0 || r >= SIZE || c < 0 || c >= SIZE || bd[r][c] !== player) break;
            count++;
        }
        for (let d = 1; d < 5; d++) {
            let r = row - dx * d, c = col - dy * d;
            if (r < 0 || r >= SIZE || c < 0 || c >= SIZE || bd[r][c] !== player) break;
            count++;
        }
        if (count >= 5) return true;
    }
    return false;
}

function isBoardFullCustom(bd) {
    return bd.flat().every(cell => cell);
}

// Hàm đánh giá điểm cho một nước đi
function evaluateMove(row, col, player) {
    let score = 0;
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];
    for (const [dx, dy] of directions) {
        let count = 1;
        let block = 0;
        for (let d = 1; d < 5; d++) {
            let r = row + dx * d, c = col + dy * d;
            if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) { block++; break; }
            if (board[r][c] === player) count++;
            else if (board[r][c]) { block++; break; }
            else break;
        }
        for (let d = 1; d < 5; d++) {
            let r = row - dx * d, c = col - dy * d;
            if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) { block++; break; }
            if (board[r][c] === player) count++;
            else if (board[r][c]) { block++; break; }
            else break;
        }
        // Điểm số dựa trên số lượng quân liên tiếp và số đầu bị chặn
        if (count >= 5) score += 10000;
        else if (count === 4 && block === 0) score += 1000;
        else if (count === 4 && block === 1) score += 200;
        else if (count === 3 && block === 0) score += 100;
        else if (count === 3 && block === 1) score += 30;
        else if (count === 2 && block === 0) score += 10;
    }
    return score;
}
}

function checkWin(row, col, player) {
    // Kiểm tra 5 quân liên tiếp
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];
    for (const [dx, dy] of directions) {
        let count = 1;
        for (let d = 1; d < 5; d++) {
            let r = row + dx * d, c = col + dy * d;
            if (r < 0 || r >= SIZE || c < 0 || c >= SIZE || board[r][c] !== player) break;
            count++;
        }
        for (let d = 1; d < 5; d++) {
            let r = row - dx * d, c = col - dy * d;
            if (r < 0 || r >= SIZE || c < 0 || c >= SIZE || board[r][c] !== player) break;
            count++;
        }
        if (count >= 5) return true;
    }
    return false;
}

function isBoardFull() {
    return board.flat().every(cell => cell);
}

restartBtn.onclick = () => {
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
            board[i][j] = '';
        }
    }
    gameOver = false;
    statusDiv.textContent = 'Đến lượt bạn!';
    renderBoard();
};

// Khởi tạo
statusDiv.textContent = 'Đến lượt bạn!';
renderBoard();
