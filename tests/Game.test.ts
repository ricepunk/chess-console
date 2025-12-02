import { PassThrough } from "node:stream";
import type { Board } from "../src/Board";
import { Game } from "../src/Game";
import { GameMode } from "../src/GameMode";
import { Piece, PieceColor, PieceType } from "../src/Piece";

describe("Game", () => {
	// biome-ignore lint/suspicious/noExplicitAny: Diperlukan untuk mengakses member privat dalam pengujian
	let game: any;
	let board: Board;
	let inputStream: PassThrough;
	let outputStream: PassThrough;

	beforeEach(() => {
		jest.spyOn(console, "log").mockImplementation(() => {}); // Menekan output console.log selama pengujian
		inputStream = new PassThrough();
		outputStream = new PassThrough();
		game = new Game(GameMode.PlayerVsPlayer, inputStream, outputStream);
		board = game.board; // Mengakses board privat untuk tujuan pengujian
	});

	afterEach(() => {
		jest.restoreAllMocks(); // Mengembalikan implementasi console.log
		game.close(); // Menutup antarmuka readline untuk mencegah kebocoran handle
	});

	// Fungsi pembantu untuk menempatkan bidak di papan untuk pengujian
	const setPiece = (
		row: number,
		col: number,
		type: PieceType,
		color: PieceColor,
		hasMoved: boolean = false,
	) => {
		const piece = new Piece(type, color);
		piece.hasMoved = hasMoved;
		board.board[row][col] = piece;
	};

	// Fungsi pembantu untuk mengosongkan sebuah kotak
	const clearSquare = (row: number, col: number) => {
		board.board[row][col] = null;
	};

	describe("parseInput", () => {
		it("should parse numeric coordinates correctly", () => {
			const move = game.parseInput("1,0 3,0");
			expect(move).toEqual({ startRow: 1, startCol: 0, endRow: 3, endCol: 0 });
		});

		it("should parse algebraic coordinates correctly", () => {
			const move = game.parseInput("a2 a4");
			expect(move).toEqual({ startRow: 6, startCol: 0, endRow: 4, endCol: 0 });
		});

		it("should parse mixed coordinates correctly", () => {
			const move = game.parseInput("a2 3,0");
			expect(move).toEqual({ startRow: 6, startCol: 0, endRow: 3, endCol: 0 });
		});

		it("should return null for invalid format", () => {
			expect(game.parseInput("a2a4")).toBeNull();
			expect(game.parseInput("a2")).toBeNull();
			expect(game.parseInput("a2 a4 b6")).toBeNull();
		});

		it("should return null for out of bounds coordinates", () => {
			expect(game.parseInput("a9 a4")).toBeNull();
			expect(game.parseInput("i2 a4")).toBeNull();
			expect(game.parseInput("a2 a9")).toBeNull();
		});
	});

	describe("isValidMove - General", () => {
		beforeEach(() => {
			// Mengosongkan papan untuk penyiapan pengujian spesifik
			board.board = Array(8)
				.fill(null)
				.map(() => Array(8).fill(null));
		});

		it("should return false if no piece at starting position", () => {
			clearSquare(6, 0); // Memastikan kotak kosong
			expect(game.isValidMove(6, 0, 4, 0)).toBe(false);
		});

		it("should return false if piece belongs to opponent", () => {
			setPiece(6, 0, PieceType.Pawn, PieceColor.Black); // Pion hitam saat giliran putih
			game.currentPlayer = PieceColor.White;
			expect(game.isValidMove(6, 0, 4, 0)).toBe(false);
		});

		it("should return false if moving to the same square", () => {
			setPiece(6, 0, PieceType.Pawn, PieceColor.White);
			game.currentPlayer = PieceColor.White;
			expect(game.isValidMove(6, 0, 6, 0)).toBe(false);
		});

		it("should return false if capturing own piece", () => {
			setPiece(6, 0, PieceType.Pawn, PieceColor.White);
			setPiece(5, 0, PieceType.Pawn, PieceColor.White); // Bidak sendiri di kotak tujuan
			game.currentPlayer = PieceColor.White;
			expect(game.isValidMove(6, 0, 5, 0)).toBe(false);
		});
	});

	describe("isValidMove - Pawn", () => {
		beforeEach(() => {
			board.board = Array(8)
				.fill(null)
				.map(() => Array(8).fill(null));
			game.currentPlayer = PieceColor.White;
		});

		it("should allow white pawn 1-square forward move", () => {
			setPiece(6, 0, PieceType.Pawn, PieceColor.White);
			expect(game.isValidMove(6, 0, 5, 0)).toBe(true);
		});

		it("should allow white pawn 2-square initial forward move", () => {
			setPiece(6, 0, PieceType.Pawn, PieceColor.White);
			expect(game.isValidMove(6, 0, 4, 0)).toBe(true);
		});

		it("should not allow white pawn 2-square move if not first move", () => {
			setPiece(6, 0, PieceType.Pawn, PieceColor.White, true); // hasMoved = true
			expect(game.isValidMove(6, 0, 4, 0)).toBe(false);
		});

		it("should not allow white pawn 2-square move if obstructed", () => {
			setPiece(6, 0, PieceType.Pawn, PieceColor.White);
			setPiece(5, 0, PieceType.Pawn, PieceColor.Black); // Terdapat penghalang
			expect(game.isValidMove(6, 0, 4, 0)).toBe(false);
		});

		it("should allow white pawn diagonal capture", () => {
			setPiece(6, 1, PieceType.Pawn, PieceColor.White);
			setPiece(5, 0, PieceType.Pawn, PieceColor.Black); // Bidak yang akan dimakan
			expect(game.isValidMove(6, 1, 5, 0)).toBe(true);
		});

		it("should not allow white pawn diagonal move without capture", () => {
			setPiece(6, 1, PieceType.Pawn, PieceColor.White);
			clearSquare(5, 0); // Tidak ada bidak untuk dimakan
			expect(game.isValidMove(6, 1, 5, 0)).toBe(false);
		});

		it("should not allow white pawn straight capture", () => {
			setPiece(6, 0, PieceType.Pawn, PieceColor.White);
			setPiece(5, 0, PieceType.Pawn, PieceColor.Black); // Bidak yang akan dimakan
			expect(game.isValidMove(6, 0, 5, 0)).toBe(false);
		});
	});

	describe("isValidMove - Rook", () => {
		beforeEach(() => {
			board.board = Array(8)
				.fill(null)
				.map(() => Array(8).fill(null));
			game.currentPlayer = PieceColor.White;
		});

		it("should allow valid horizontal rook move", () => {
			setPiece(0, 0, PieceType.Rook, PieceColor.White);
			expect(game.isValidMove(0, 0, 0, 7)).toBe(true);
		});

		it("should allow valid vertical rook move", () => {
			setPiece(0, 0, PieceType.Rook, PieceColor.White);
			expect(game.isValidMove(0, 0, 7, 0)).toBe(true);
		});

		it("should not allow obstructed horizontal rook move", () => {
			setPiece(0, 0, PieceType.Rook, PieceColor.White);
			setPiece(0, 1, PieceType.Pawn, PieceColor.Black); // Terdapat penghalang
			expect(game.isValidMove(0, 0, 0, 7)).toBe(false);
		});

		it("should not allow obstructed vertical rook move", () => {
			setPiece(0, 0, PieceType.Rook, PieceColor.White);
			setPiece(1, 0, PieceType.Pawn, PieceColor.Black); // Terdapat penghalang
			expect(game.isValidMove(0, 0, 7, 0)).toBe(false);
		});

		it("should not allow diagonal rook move", () => {
			setPiece(0, 0, PieceType.Rook, PieceColor.White);
			expect(game.isValidMove(0, 0, 1, 1)).toBe(false);
		});
	});

	describe("isValidMove - Knight", () => {
		beforeEach(() => {
			board.board = Array(8)
				.fill(null)
				.map(() => Array(8).fill(null));
			game.currentPlayer = PieceColor.White;
		});

		it("should allow valid L-shaped knight move", () => {
			setPiece(3, 3, PieceType.Knight, PieceColor.White);
			expect(game.isValidMove(3, 3, 5, 4)).toBe(true);
			expect(game.isValidMove(3, 3, 5, 2)).toBe(true);
			expect(game.isValidMove(3, 3, 4, 5)).toBe(true);
			expect(game.isValidMove(3, 3, 2, 5)).toBe(true);
			expect(game.isValidMove(3, 3, 1, 4)).toBe(true);
			expect(game.isValidMove(3, 3, 1, 2)).toBe(true);
			expect(game.isValidMove(3, 3, 2, 1)).toBe(true);
			expect(game.isValidMove(3, 3, 4, 1)).toBe(true);
		});

		it("should allow knight to jump over pieces", () => {
			setPiece(3, 3, PieceType.Knight, PieceColor.White);
			setPiece(4, 3, PieceType.Pawn, PieceColor.Black); // Terdapat penghalang
			expect(game.isValidMove(3, 3, 5, 4)).toBe(true); // Kuda dapat melompat
		});

		it("should not allow invalid knight move", () => {
			setPiece(3, 3, PieceType.Knight, PieceColor.White);
			expect(game.isValidMove(3, 3, 3, 4)).toBe(false); // Gerakan lurus
			expect(game.isValidMove(3, 3, 4, 4)).toBe(false); // Gerakan diagonal
		});
	});

	describe("isValidMove - Bishop", () => {
		beforeEach(() => {
			board.board = Array(8)
				.fill(null)
				.map(() => Array(8).fill(null));
			game.currentPlayer = PieceColor.White;
		});

		it("should allow valid diagonal bishop move", () => {
			setPiece(0, 2, PieceType.Bishop, PieceColor.White);
			expect(game.isValidMove(0, 2, 5, 7)).toBe(true); // Diperbaiki: langkah diagonal yang valid
		});

		it("should not allow obstructed diagonal bishop move", () => {
			setPiece(0, 2, PieceType.Bishop, PieceColor.White);
			setPiece(1, 3, PieceType.Pawn, PieceColor.Black); // Terdapat penghalang
			expect(game.isValidMove(0, 2, 7, 7)).toBe(false);
		});

		it("should not allow non-diagonal bishop move", () => {
			setPiece(0, 2, PieceType.Bishop, PieceColor.White);
			expect(game.isValidMove(0, 2, 0, 3)).toBe(false); // Horizontal
			expect(game.isValidMove(0, 2, 1, 2)).toBe(false); // Vertikal
		});
	});

	describe("isValidMove - Queen", () => {
		beforeEach(() => {
			board.board = Array(8)
				.fill(null)
				.map(() => Array(8).fill(null));
			game.currentPlayer = PieceColor.White;
		});

		it("should allow valid horizontal queen move", () => {
			setPiece(0, 3, PieceType.Queen, PieceColor.White);
			expect(game.isValidMove(0, 3, 0, 7)).toBe(true);
		});

		it("should allow valid vertical queen move", () => {
			setPiece(0, 3, PieceType.Queen, PieceColor.White);
			expect(game.isValidMove(0, 3, 7, 3)).toBe(true);
		});

		it("should allow valid diagonal queen move", () => {
			setPiece(0, 3, PieceType.Queen, PieceColor.White);
			expect(game.isValidMove(0, 3, 3, 0)).toBe(true); // Diperbaiki: langkah diagonal yang valid
		});

		it("should not allow obstructed queen move", () => {
			setPiece(0, 3, PieceType.Queen, PieceColor.White);
			setPiece(0, 4, PieceType.Pawn, PieceColor.Black); // Terdapat penghalang
			expect(game.isValidMove(0, 3, 0, 7)).toBe(false);
		});

		it("should not allow invalid queen move", () => {
			setPiece(3, 3, PieceType.Queen, PieceColor.White);
			expect(game.isValidMove(3, 3, 5, 4)).toBe(false); // Langkah kuda
		});
	});

	describe("isValidMove - King", () => {
		beforeEach(() => {
			board.board = Array(8)
				.fill(null)
				.map(() => Array(8).fill(null));
			game.currentPlayer = PieceColor.White;
		});

		it("should allow valid 1-square king move", () => {
			setPiece(4, 4, PieceType.King, PieceColor.White);
			expect(game.isValidMove(4, 4, 3, 4)).toBe(true); // Atas
			expect(game.isValidMove(4, 4, 5, 4)).toBe(true); // Bawah
			expect(game.isValidMove(4, 4, 4, 3)).toBe(true); // Kiri
			expect(game.isValidMove(4, 4, 4, 5)).toBe(true); // Kanan
			expect(game.isValidMove(4, 4, 3, 3)).toBe(true); // Diagonal Atas-Kiri
			expect(game.isValidMove(4, 4, 3, 5)).toBe(true); // Diagonal Atas-Kanan
			expect(game.isValidMove(4, 4, 5, 3)).toBe(true); // Diagonal Bawah-Kiri
			expect(game.isValidMove(4, 4, 5, 5)).toBe(true); // Diagonal Bawah-Kanan
		});

		it("should not allow 2-square king move", () => {
			setPiece(4, 4, PieceType.King, PieceColor.White);
			expect(game.isValidMove(4, 4, 2, 4)).toBe(false);
		});
	});

	describe("executeMove", () => {
		beforeEach(() => {
			board.board = Array(8)
				.fill(null)
				.map(() => Array(8).fill(null));
			game.currentPlayer = PieceColor.White;
		});

		it("should move a piece to the target square", async () => {
			setPiece(6, 0, PieceType.Pawn, PieceColor.White);
			await game.executeMove(6, 0, 5, 0);
			expect(board.board[5][0]).toBeInstanceOf(Piece);
			expect(board.board[5][0]?.type).toBe(PieceType.Pawn);
			expect(board.board[6][0]).toBeNull();
		});

		it("should set hasMoved to true after moving a piece", async () => {
			setPiece(6, 0, PieceType.Pawn, PieceColor.White, false);
			await game.executeMove(6, 0, 5, 0);
			expect(board.board[5][0]?.hasMoved).toBe(true);
		});
	});

	describe("Pawn Promotion", () => {
		beforeEach(() => {
			board.board = Array(8)
				.fill(null)
				.map(() => Array(8).fill(null));
			game.currentPlayer = PieceColor.White;
		});

		it("should promote a white pawn to a Queen on reaching the last rank", async () => {
			setPiece(1, 0, PieceType.Pawn, PieceColor.White);
			clearSquare(0, 0);

			// Mock the question asking for promotion
			const askQuestionMock = jest
				.spyOn(game, "askQuestion")
				.mockResolvedValue("Q");

			await game.executeMove(1, 0, 0, 0);

			const promotedPiece = board.board[0][0];
			expect(promotedPiece).toBeInstanceOf(Piece);
			expect(promotedPiece?.type).toBe(PieceType.Queen);
			expect(promotedPiece?.color).toBe(PieceColor.White);
			askQuestionMock.mockRestore();
		});

		it("should promote a black pawn to a Rook on reaching the last rank", async () => {
			setPiece(6, 7, PieceType.Pawn, PieceColor.Black);
			clearSquare(7, 7);
			game.currentPlayer = PieceColor.Black;

			// Mock the question asking for promotion
			const askQuestionMock = jest
				.spyOn(game, "askQuestion")
				.mockResolvedValue("R");

			await game.executeMove(6, 7, 7, 7);

			const promotedPiece = board.board[7][7];
			expect(promotedPiece).toBeInstanceOf(Piece);
			expect(promotedPiece?.type).toBe(PieceType.Rook);
			expect(promotedPiece?.color).toBe(PieceColor.Black);
			askQuestionMock.mockRestore();
		});

		it("should default to Queen if player provides invalid promotion choice", async () => {
			setPiece(1, 0, PieceType.Pawn, PieceColor.White);
			clearSquare(0, 0);

			// Mock the question asking for promotion with an invalid choice
			const askQuestionMock = jest
				.spyOn(game, "askQuestion")
				.mockResolvedValue("InvalidChoice");

			await game.executeMove(1, 0, 0, 0);

			const promotedPiece = board.board[0][0];
			expect(promotedPiece?.type).toBe(PieceType.Queen);
			askQuestionMock.mockRestore();
		});

		it("should auto-promote to Queen for AI player", async () => {
			// Atur mode permainan ke PlayerVsComputer, di mana Hitam adalah AI
			game = new Game(GameMode.PlayerVsComputer, inputStream, outputStream);
			board = game.board; // Perbarui referensi papan
			board.board = Array(8)
				.fill(null)
				.map(() => Array(8).fill(null));

			setPiece(6, 5, PieceType.Pawn, PieceColor.Black);
			clearSquare(7, 5);
			game.currentPlayer = PieceColor.Black;

			// Tidak ada input yang diperlukan dari stream untuk AI
			await game.executeMove(6, 5, 7, 5);

			const promotedPiece = board.board[7][5];
			expect(promotedPiece).toBeInstanceOf(Piece);
			expect(promotedPiece?.type).toBe(PieceType.Queen);
			expect(promotedPiece?.color).toBe(PieceColor.Black);
		});
	});

	describe("Castling", () => {
		beforeEach(() => {
			board.board = Array(8)
				.fill(null)
				.map(() => Array(8).fill(null));
			game.currentPlayer = PieceColor.White;
		});

		it("should allow valid kingside castling for white", () => {
			setPiece(7, 4, PieceType.King, PieceColor.White, false);
			setPiece(7, 7, PieceType.Rook, PieceColor.White, false);
			clearSquare(7, 5);
			clearSquare(7, 6);
			expect(game.isValidMove(7, 4, 7, 6)).toBe(true);
		});

		it("should allow valid queenside castling for white", () => {
			setPiece(7, 4, PieceType.King, PieceColor.White, false);
			setPiece(7, 0, PieceType.Rook, PieceColor.White, false);
			clearSquare(7, 1);
			clearSquare(7, 2);
			clearSquare(7, 3);
			expect(game.isValidMove(7, 4, 7, 2)).toBe(true);
		});

		it("should not allow castling if king has moved", () => {
			setPiece(7, 4, PieceType.King, PieceColor.White, true); // King has moved
			setPiece(7, 7, PieceType.Rook, PieceColor.White, false);
			clearSquare(7, 5);
			clearSquare(7, 6);
			expect(game.isValidMove(7, 4, 7, 6)).toBe(false);
		});

		it("should not allow castling if rook has moved", () => {
			setPiece(7, 4, PieceType.King, PieceColor.White, false);
			setPiece(7, 7, PieceType.Rook, PieceColor.White, true); // Rook has moved
			clearSquare(7, 5);
			clearSquare(7, 6);
			expect(game.isValidMove(7, 4, 7, 6)).toBe(false);
		});

		it("should not allow castling if path is blocked", () => {
			setPiece(7, 4, PieceType.King, PieceColor.White, false);
			setPiece(7, 7, PieceType.Rook, PieceColor.White, false);
			setPiece(7, 5, PieceType.Knight, PieceColor.White); // Path is blocked
			clearSquare(7, 6);
			expect(game.isValidMove(7, 4, 7, 6)).toBe(false);
		});

		it("should not allow castling if king is in check", () => {
			setPiece(7, 4, PieceType.King, PieceColor.White, false);
			setPiece(7, 7, PieceType.Rook, PieceColor.White, false);
			setPiece(0, 4, PieceType.Rook, PieceColor.Black); // King is in check
			clearSquare(7, 5);
			clearSquare(7, 6);
			expect(game.isValidMove(7, 4, 7, 6)).toBe(false);
		});

		it("should not allow castling through an attacked square", () => {
			setPiece(7, 4, PieceType.King, PieceColor.White, false);
			setPiece(7, 7, PieceType.Rook, PieceColor.White, false);
			setPiece(0, 5, PieceType.Rook, PieceColor.Black); // Attacks square king moves through
			clearSquare(7, 5);
			clearSquare(7, 6);
			expect(game.isValidMove(7, 4, 7, 6)).toBe(false);
		});

		it("should move the rook correctly after kingside castling", async () => {
			setPiece(7, 4, PieceType.King, PieceColor.White, false);
			setPiece(7, 7, PieceType.Rook, PieceColor.White, false);
			clearSquare(7, 5);
			clearSquare(7, 6);
			await game.executeMove(7, 4, 7, 6);
			expect(board.board[7][6]?.type).toBe(PieceType.King);
			expect(board.board[7][5]?.type).toBe(PieceType.Rook);
			expect(board.board[7][4]).toBeNull();
			expect(board.board[7][7]).toBeNull();
		});
	});

	describe("Check, Checkmate, and Stalemate", () => {
		beforeEach(() => {
			board.board = Array(8)
				.fill(null)
				.map(() => Array(8).fill(null));
			game.currentPlayer = PieceColor.White;
		});

		it("should not allow a move that leaves the king in check (pinned piece)", () => {
			// King Putih di e1, Benteng Hitam di e8, Benteng Putih di e2
			setPiece(7, 4, PieceType.King, PieceColor.White);
			setPiece(0, 4, PieceType.Rook, PieceColor.Black);
			setPiece(6, 4, PieceType.Rook, PieceColor.White); // Benteng ini di-pin

			// Mencoba memindahkan benteng yang di-pin adalah langkah ilegal
			expect(game.isValidMove(6, 4, 6, 5)).toBe(false);
		});

		it("should not allow the king to move into a checked square", () => {
			setPiece(7, 4, PieceType.King, PieceColor.White);
			setPiece(0, 3, PieceType.Rook, PieceColor.Black); // Menyerang kotak d1 (7,3)

			// Mencoba memindahkan raja ke kotak yang diserang
			expect(game.isValidMove(7, 4, 7, 3)).toBe(false);
		});

		it("should detect the conditions for checkmate", () => {
			// Atur posisi skakmat (Ratu & Raja vs Raja)
			// Raja Hitam di h8 (0,7), di-skak oleh Ratu Putih di g7 (1,6)
			// Raja Putih di f6 (2,5) melindungi ratu dan membatasi gerak
			setPiece(0, 7, PieceType.King, PieceColor.Black);
			setPiece(1, 6, PieceType.Queen, PieceColor.White);
			setPiece(2, 5, PieceType.King, PieceColor.White);

			game.currentPlayer = PieceColor.Black; // Sekarang giliran hitam

			// Verifikasi kondisi skakmat
			expect(game.isKingInCheck(PieceColor.Black)).toBe(true);
			expect(game.getAllValidMovesForColor(PieceColor.Black).length).toBe(0);
		});

		it("should detect the conditions for stalemate", () => {
			// Atur posisi stalemate
			// Raja Hitam di h8, tidak di-skak
			// Ratu Putih di g6, mengontrol semua kotak pelarian
			setPiece(0, 7, PieceType.King, PieceColor.Black);
			setPiece(2, 6, PieceType.Queen, PieceColor.White);
			setPiece(7, 7, PieceType.King, PieceColor.White); // Perlu raja putih agar valid

			game.currentPlayer = PieceColor.Black; // Sekarang giliran hitam

			// Verifikasi kondisi stalemate
			expect(game.isKingInCheck(PieceColor.Black)).toBe(false);
			expect(game.getAllValidMovesForColor(PieceColor.Black).length).toBe(0);
		});
	});
});
