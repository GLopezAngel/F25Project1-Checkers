/**
 * Checkers 2D Game.
 * 
 * This file is complete. It can be used to confirm that the CheckersGame class
 * is working correctly.
 */

import { CheckersGame } from './CheckersGame.js';

/**
 * Load the game and render the board.
 */
window.addEventListener('load', () => {
    const game = new CheckersGame();
    const boardElement = document.getElementById('gameBoard');

    /**
     * Render the game board.
     */
    function render() {
        // Render board
        const selectedPiece = game.selectedPiece;
        const validMoves = game.validMoves;
        boardElement.innerHTML = '';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                // Alternate cell colors
                cell.classList.add((row + col) % 2 ? 'dark' : 'light');
                
                // Highlight selected piece
                if (posMatch(selectedPiece, { row, col })) {
                    cell.classList.add('selected');
                }

                // Highlight valid moves
                if (validMoves.some(move => posMatch(move, { row, col }))) {
                    cell.classList.add('valid-move');
                }

                // Add piece if exists
                const piece = game.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.color}`;
                    if (piece.isKing) { pieceElement.classList.add('king'); }
                    cell.appendChild(pieceElement);
                }
                
                cell.addEventListener('click', () => handleCellClick(row, col));
                boardElement.appendChild(cell);
            }
        }
    }

    /**
     * Handle the click event on a cell.
     * @param {number} row the row of the cell
     * @param {number} col the column of the cell
     */
    function handleCellClick(row, col) {
        if (game.isGameOver) { return; }
        if (!game.selectPiece(row, col) && !game.makeMove(row, col)) {
            game.deselectPiece();
        }
        render();
    }

    // Reset the game
    document.getElementById('resetButton').addEventListener('click', () => {
        game.reset();
        render();
    });

    // Initial rendering of the game
    render();
});

/**
 * Check if two positions match
 * @param {object} pos1 the first position { row: number, col: number }
 * @param {object} pos2 the second position { row: number, col: number }
 * @returns {boolean} true if the positions match, false otherwise
 */
function posMatch(pos1, pos2) {
    return pos1 && pos2 && pos1.row === pos2.row && pos1.col === pos2.col;
}
