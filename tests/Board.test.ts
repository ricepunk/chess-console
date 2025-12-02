import { Board } from "../src/Board";
import { Piece, PieceColor, PieceType } from "../src/Piece";

describe("Board", () => {
	let board: Board;

	beforeEach(() => {
		board = new Board();
	});

	it("should initialize an 8x8 board", () => {
		expect(board.board.length).toBe(8);
		board.board.forEach((row) => {
			expect(row.length).toBe(8);
		});
	});

	it("should place white pawns correctly", () => {
		for (let i = 0; i < 8; i++) {
			const piece = board.board[6][i];
			expect(piece).toBeInstanceOf(Piece);
			expect(piece?.type).toBe(PieceType.Pawn);
			expect(piece?.color).toBe(PieceColor.White);
		}
	});

	it("should place black pawns correctly", () => {
		for (let i = 0; i < 8; i++) {
			const piece = board.board[1][i];
			expect(piece).toBeInstanceOf(Piece);
			expect(piece?.type).toBe(PieceType.Pawn);
			expect(piece?.color).toBe(PieceColor.Black);
		}
	});

	it("should place white rooks correctly", () => {
		const whiteRook1 = board.board[7][0];
		const whiteRook2 = board.board[7][7];
		expect(whiteRook1).toBeInstanceOf(Piece);
		expect(whiteRook1?.type).toBe(PieceType.Rook);
		expect(whiteRook1?.color).toBe(PieceColor.White);
		expect(whiteRook2).toBeInstanceOf(Piece);
		expect(whiteRook2?.type).toBe(PieceType.Rook);
		expect(whiteRook2?.color).toBe(PieceColor.White);
	});

	it("should place black rooks correctly", () => {
		const blackRook1 = board.board[0][0];
		const blackRook2 = board.board[0][7];
		expect(blackRook1).toBeInstanceOf(Piece);
		expect(blackRook1?.type).toBe(PieceType.Rook);
		expect(blackRook1?.color).toBe(PieceColor.Black);
		expect(blackRook2).toBeInstanceOf(Piece);
		expect(blackRook2?.type).toBe(PieceType.Rook);
		expect(blackRook2?.color).toBe(PieceColor.Black);
	});

	it("should place white knights correctly", () => {
		const whiteKnight1 = board.board[7][1];
		const whiteKnight2 = board.board[7][6];
		expect(whiteKnight1).toBeInstanceOf(Piece);
		expect(whiteKnight1?.type).toBe(PieceType.Knight);
		expect(whiteKnight1?.color).toBe(PieceColor.White);
		expect(whiteKnight2).toBeInstanceOf(Piece);
		expect(whiteKnight2?.type).toBe(PieceType.Knight);
		expect(whiteKnight2?.color).toBe(PieceColor.White);
	});

	it("should place black knights correctly", () => {
		const blackKnight1 = board.board[0][1];
		const blackKnight2 = board.board[0][6];
		expect(blackKnight1).toBeInstanceOf(Piece);
		expect(blackKnight1?.type).toBe(PieceType.Knight);
		expect(blackKnight1?.color).toBe(PieceColor.Black);
		expect(blackKnight2).toBeInstanceOf(Piece);
		expect(blackKnight2?.type).toBe(PieceType.Knight);
		expect(blackKnight2?.color).toBe(PieceColor.Black);
	});

	it("should place white bishops correctly", () => {
		const whiteBishop1 = board.board[7][2];
		const whiteBishop2 = board.board[7][5];
		expect(whiteBishop1).toBeInstanceOf(Piece);
		expect(whiteBishop1?.type).toBe(PieceType.Bishop);
		expect(whiteBishop1?.color).toBe(PieceColor.White);
		expect(whiteBishop2).toBeInstanceOf(Piece);
		expect(whiteBishop2?.type).toBe(PieceType.Bishop);
		expect(whiteBishop2?.color).toBe(PieceColor.White);
	});

	it("should place black bishops correctly", () => {
		const blackBishop1 = board.board[0][2];
		const blackBishop2 = board.board[0][5];
		expect(blackBishop1).toBeInstanceOf(Piece);
		expect(blackBishop1?.type).toBe(PieceType.Bishop);
		expect(blackBishop1?.color).toBe(PieceColor.Black);
		expect(blackBishop2).toBeInstanceOf(Piece);
		expect(blackBishop2?.type).toBe(PieceType.Bishop);
		expect(blackBishop2?.color).toBe(PieceColor.Black);
	});

	it("should place white queen correctly", () => {
		const whiteQueen = board.board[7][3];
		expect(whiteQueen).toBeInstanceOf(Piece);
		expect(whiteQueen?.type).toBe(PieceType.Queen);
		expect(whiteQueen?.color).toBe(PieceColor.White);
	});

	it("should place black queen correctly", () => {
		const blackQueen = board.board[0][3];
		expect(blackQueen).toBeInstanceOf(Piece);
		expect(blackQueen?.type).toBe(PieceType.Queen);
		expect(blackQueen?.color).toBe(PieceColor.Black);
	});

	it("should place white king correctly", () => {
		const whiteKing = board.board[7][4];
		expect(whiteKing).toBeInstanceOf(Piece);
		expect(whiteKing?.type).toBe(PieceType.King);
		expect(whiteKing?.color).toBe(PieceColor.White);
	});

	it("should place black king correctly", () => {
		const blackKing = board.board[0][4];
		expect(blackKing).toBeInstanceOf(Piece);
		expect(blackKing?.type).toBe(PieceType.King);
		expect(blackKing?.color).toBe(PieceColor.Black);
	});

	it("should have null in empty squares", () => {
		// Cek beberapa kotak kosong
		expect(board.board[2][0]).toBeNull();
		expect(board.board[3][3]).toBeNull();
		expect(board.board[4][4]).toBeNull();
		expect(board.board[5][7]).toBeNull();
	});
});
