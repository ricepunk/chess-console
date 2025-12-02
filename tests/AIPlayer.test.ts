import { AIPlayer, type Move } from "../src/AIPlayer";
import { Board } from "../src/Board";
import type { Game } from "../src/Game";
import { Piece, PieceColor, PieceType } from "../src/Piece";

interface MockGameForAI {
	board: Board;
	currentPlayer: PieceColor;
	isValidMove: jest.Mock;
}

describe("AIPlayer", () => {
	let aiPlayer: AIPlayer;
	let mockBoard: Board;
	let mockGame: MockGameForAI;
	let playerColor: PieceColor;

	beforeEach(() => {
		aiPlayer = new AIPlayer();
		playerColor = PieceColor.Black;

		// Mock Board
		mockBoard = new Board();
		// Clear the board for specific test setups
		mockBoard.board = Array(8)
			.fill(null)
			.map(() => Array(8).fill(null));

		// Mock Game
		// We need to mock the internal board and isValidMove method
		mockGame = {
			board: mockBoard,
			currentPlayer: playerColor,
			isValidMove: jest.fn(),
		};
	});

	it("should find a random valid move when available", () => {
		// Set up a piece on the board that can make a valid move
		const piece = new Piece(PieceType.Pawn, playerColor);
		mockBoard.board[1][0] = piece; // Black pawn at (1,0)

		// Mock isValidMove to return true for a specific move
		(mockGame.isValidMove as jest.Mock).mockImplementation(
			(startRow, startCol, endRow, endCol) => {
				// A black pawn at (1,0) moving to (2,0)
				return startRow === 1 && startCol === 0 && endRow === 2 && endCol === 0;
			},
		);

		const move = aiPlayer.findRandomMove(
			mockBoard,
			playerColor,
			mockGame as unknown as Game,
		);

		expect(move).not.toBeNull();
		expect(move).toEqual({ startRow: 1, startCol: 0, endRow: 2, endCol: 0 });
		expect(mockGame.isValidMove).toHaveBeenCalled();
	});

	it("should return null when no valid moves are available", () => {
		// Place a piece on the board, but ensure no valid moves are found for it
		mockBoard.board[1][0] = new Piece(PieceType.Pawn, playerColor);

		// Mock isValidMove to always return false
		(mockGame.isValidMove as jest.Mock).mockReturnValue(false);

		const move = aiPlayer.findRandomMove(
			mockBoard,
			playerColor,
			mockGame as unknown as Game,
		);

		expect(move).toBeNull();
		// It should still try to find moves, so isValidMove should be called
		expect(mockGame.isValidMove).toHaveBeenCalled();
	});

	it("should find one of multiple random valid moves", () => {
		// Set up a piece with multiple valid moves
		const piece = new Piece(PieceType.Pawn, playerColor);
		mockBoard.board[1][0] = piece; // Black pawn at (1,0)
		mockBoard.board[1][1] = piece; // Another black pawn at (1,1)

		const validMoves: Move[] = [
			{ startRow: 1, startCol: 0, endRow: 2, endCol: 0 },
			{ startRow: 1, startCol: 0, endRow: 3, endCol: 0 }, // 2-square move
			{ startRow: 1, startCol: 1, endRow: 2, endCol: 1 },
		];

		// Mock isValidMove to return true for these specific moves
		(mockGame.isValidMove as jest.Mock).mockImplementation(
			(startRow, startCol, endRow, endCol) => {
				return validMoves.some(
					(m) =>
						m.startRow === startRow &&
						m.startCol === startCol &&
						m.endRow === endRow &&
						m.endCol === endCol,
				);
			},
		);

		const move = aiPlayer.findRandomMove(
			mockBoard,
			playerColor,
			mockGame as unknown as Game,
		);

		expect(move).not.toBeNull();
		// Expect the move to be one of the predefined valid moves
		expect(validMoves).toContainEqual(move);
		expect(mockGame.isValidMove).toHaveBeenCalled();
	});

	it("should only consider pieces of the current player's color", () => {
		// Place a black pawn and a white pawn
		mockBoard.board[1][0] = new Piece(PieceType.Pawn, PieceColor.Black);
		mockBoard.board[6][0] = new Piece(PieceType.Pawn, PieceColor.White);

		// Mock isValidMove to return true for any move of the black pawn, but not white
		(mockGame.isValidMove as jest.Mock).mockImplementation(
			(startRow, startCol, endRow, endCol) => {
				// Only black pawn moves are considered valid, and specifically straight forward
				return (
					mockBoard.board[startRow][startCol]?.color === PieceColor.Black &&
					startRow === 1 &&
					startCol === 0 &&
					endRow === 2 &&
					endCol === 0
				);
			},
		);

		const move = aiPlayer.findRandomMove(
			mockBoard,
			playerColor,
			mockGame as unknown as Game,
		);

		expect(move).not.toBeNull();
		expect(move?.startRow).toBe(1);
		expect(move?.startCol).toBe(0);
		expect(move?.endRow).toBe(2);
		expect(move?.endCol).toBe(0);
		expect(mockGame.isValidMove).toHaveBeenCalled();

		// Change player color to white, and expect no move if no white piece can move
		playerColor = PieceColor.White;
		mockGame.currentPlayer = playerColor;
		// Mock isValidMove to return true for any move of the white pawn
		(mockGame.isValidMove as jest.Mock).mockImplementation(
			(startRow, startCol, endRow, endCol) => {
				// Only white pawn moves are considered valid, and specifically straight forward
				return (
					mockBoard.board[startRow][startCol]?.color === PieceColor.White &&
					startRow === 6 &&
					startCol === 0 &&
					endRow === 5 &&
					endCol === 0
				);
			},
		);

		const whiteMove = aiPlayer.findRandomMove(
			mockBoard,
			playerColor,
			mockGame as unknown as Game,
		);
		expect(whiteMove).not.toBeNull();
		expect(whiteMove?.startRow).toBe(6);
		expect(whiteMove?.startCol).toBe(0);
		expect(whiteMove?.endRow).toBe(5);
		expect(whiteMove?.endCol).toBe(0);
	});
});
