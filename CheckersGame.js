/** 
 * Checkers Game logic
 * Class will be used by to run the 2D and 3D versions of the game
 * 
 */

export class CheckersGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'red'; // Red starts first
        this.selectedPiece = null;
        this.validMoves = [];
        this.mustCapture = false; // Flag to indicate if a capture is mandatory
    }

    /**
     * Initialize the checkers board with pieces in starting positions.
     * @returns {Array} 2D array representing the board
     */
    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        for (let row = 0; row < 3; row++) {
            for (let col = (row + 1) % 2; col < 8; col += 2) {
                board[row][col] = { color: 'black', isKing: false };
            }
        }
        for (let row = 5; row < 8; row++) {
            for (let col = (row + 1) % 2; col < 8; col += 2) {
                board[row][col] = { color: 'red', isKing: false };
            }
        }
        return board;
    }

    /**
     * Select a piece on the board.
     * @param {number} row the row of the piece
     * @param {number} col the column of the piece
     * @returns {boolean} true if selection is successful, false otherwise
     */
    selectPiece(row, col) {
        const piece = this.board[row][col];
        if (piece && piece.color === this.currentPlayer) {
            this.selectedPiece = { row, col };
            this.validMoves = this.getValidMoves(row, col);
            return true;
        }
        return false;
    }

    /**
     * Deselect the currently selected piece.
     */
    deselectPiece() {
        this.selectedPiece = null;
        this.validMoves = [];
    }

    /**
     * Get valid moves for a piece at a given position.
     * @param {number} row the row of the piece
     * @param {number} col the column of the piece
     * @returns {Array} array of valid move positions [{ row, col }]
     */
    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];

        const directions = piece.isKing
            ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
            : (piece.color === 'red' ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]]);

        const moves = [];
        const captures = [];

        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            // Check for normal move
            if (this.isInBounds(newRow, newCol) && !this.board[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol });
            }

            // Check for capture
            const jumpRow = row + 2 * dRow;
            const jumpCol = col + 2 * dCol;
            if (this.isInBounds(jumpRow, jumpCol) &&
                this.board[newRow][newCol] &&
                this.board[newRow][newCol].color !== piece.color &&
                !this.board[jumpRow][jumpCol]) {
                captures.push({ row: jumpRow, col: jumpCol });
            }
        }

        // If captures are available, they must be taken
        return captures.length > 0 ? captures : moves;

    }

    /**
     * Make a move to a specified position.
     * @param {number} row the target row
     * @param {number} col the target column
     * @returns {boolean} true if the move is successful, false otherwise
     */
    makeMove(row, col) {
        if (!this.selectedPiece) return false;

        const { row: selRow, col: selCol } = this.selectedPiece;
        const piece = this.board[selRow][selCol];
        const isValidMove = this.validMoves.some(move => move.row === row && move.col === col);

        if (!isValidMove) return false;

        // Move the piece
        this.board[row][col] = piece;
        this.board[selRow][selCol] = null;

        // Check for captures
        if (Math.abs(row - selRow) === 2) {
            const capRow = (row + selRow) / 2;
            const capCol = (col + selCol) / 2;
            this.board[capRow][capCol] = null; // Remove captured piece
        }

        // Promote to king if reaching the opposite end
        if ((piece.color === 'red' && row === 0) || (piece.color === 'black' && row === 7)) {
            piece.isKing = true;
        }

        // Check for additional captures
        this.selectedPiece = { row, col };
        this.validMoves = this.getValidMoves(row, col);
        if (this.validMoves.some(move => Math.abs(move.row - row) === 2)) {
            // Must continue capturing
            return true;
        }

        // Switch turns
        this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
        this.deselectPiece();
        return true;
    }

    /**
     * Check if in bounds
     */

    isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;

    
    }
 
}