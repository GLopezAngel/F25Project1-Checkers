/** * Checkers Game logic
 * Class will be used by to run the 2D and 3D versions of the game
 * */

export class CheckersGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'red'; // Red starts first
        this.selectedPiece = null;
        this.validMoves = [];
        this.mandatoryCaptures = this.getAllCaptureMoves(); // Find mandatory captures right away
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
     * Get all possible capture moves for the current player.
     * @returns {Array} array of pieces that can make a capture [{ row, col }]
     */
    getAllCaptureMoves() {
        const capturablePieces = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    const moves = this.getValidMoves(row, col);
                    // A capture move is one where the move distance is 2
                    if (moves.some(move => Math.abs(move.row - row) === 2)) {
                        capturablePieces.push({ row, col });
                    }
                }
            }
        }
        return capturablePieces;
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

            // Check if a capture is mandatory
            if (this.mandatoryCaptures.length > 0) {
                // If a capture is mandatory, ONLY allow selection of pieces that can capture
                const isCapturingPiece = this.mandatoryCaptures.some(p => p.row === row && p.col === col);
                if (!isCapturingPiece) {
                    console.log("Must select a piece that can capture!");
                    return false;
                }
            }
            
            this.selectedPiece = { row, col };
            this.validMoves = this.getValidMoves(row, col);

            // Filter moves: if captures exist for this piece, only allow those
            const potentialCaptures = this.validMoves.filter(move => Math.abs(move.row - row) === 2);
            if (potentialCaptures.length > 0) {
                this.validMoves = potentialCaptures; // Force capture for this piece
            }
            
            return this.validMoves.length > 0; // Only select if there are valid moves
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
     * NOTE: This returns ALL possible moves (normal and capture) for this piece.
     * The logic in selectPiece/makeMove determines which are *valid* based on mandatory capture rules.
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

        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            // Check for normal move (only if not a capture)
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
                moves.push({ row: jumpRow, col: jumpCol }); // Capture move added
            }
        }
        return moves;
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
        
        const isCapture = Math.abs(row - selRow) === 2;

        // Check for captures
        if (isCapture) {
            const capRow = (row + selRow) / 2;
            const capCol = (col + selCol) / 2;
            this.board[capRow][capCol] = null; // Remove captured piece
        }

        // Promote to king if reaching the opposite end
        if (!piece.isKing && ((piece.color === 'red' && row === 0) || (piece.color === 'black' && row === 7))) {
            piece.isKing = true;
        }


        // Check for **additional captures** for the same piece (chain jump)
        if (isCapture) {
            this.selectedPiece = { row, col };
            const nextMoves = this.getValidMoves(row, col);
            const nextCaptures = nextMoves.filter(move => Math.abs(move.row - row) === 2);
            
            if (nextCaptures.length > 0) {
                // Must continue capturing with the same piece
                this.validMoves = nextCaptures;
                // Note: Don't switch turns yet, just return true to indicate a successful move
                return true;
            }
        }


        // End of turn: Switch player and re-evaluate mandatory captures
        this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';
        this.deselectPiece();
        this.mandatoryCaptures = this.getAllCaptureMoves();
        
        return true;
    }

    /**
     * Check if in bounds
     */

    isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    /** * resets the game to initial state
     */
    resetGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'red';
        this.selectedPiece = null;
        this.validMoves = [];
        this.mandatoryCaptures = this.getAllCaptureMoves();
    }
}