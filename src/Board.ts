import { Piece, PieceColor, PieceType } from "./Piece";

export class Board {
	board: (Piece | null)[][];

	constructor() {
		this.board = Array(8)
			.fill(null)
			.map(() => Array(8).fill(null));
		this.initializeBoard();
	}

	initializeBoard(): void {
		// Tempatkan pion
		for (let i = 0; i < 8; i++) {
			this.board[1][i] = new Piece(PieceType.Pawn, PieceColor.Black);
			this.board[6][i] = new Piece(PieceType.Pawn, PieceColor.White);
		}

		// Tempatkan bidak hitam lainnya
		this.board[0][0] = new Piece(PieceType.Rook, PieceColor.Black);
		this.board[0][1] = new Piece(PieceType.Knight, PieceColor.Black);
		this.board[0][2] = new Piece(PieceType.Bishop, PieceColor.Black);
		this.board[0][3] = new Piece(PieceType.Queen, PieceColor.Black);
		this.board[0][4] = new Piece(PieceType.King, PieceColor.Black);
		this.board[0][5] = new Piece(PieceType.Bishop, PieceColor.Black);
		this.board[0][6] = new Piece(PieceType.Knight, PieceColor.Black);
		this.board[0][7] = new Piece(PieceType.Rook, PieceColor.Black);

		// Tempatkan bidak putih lainnya
		this.board[7][0] = new Piece(PieceType.Rook, PieceColor.White);
		this.board[7][1] = new Piece(PieceType.Knight, PieceColor.White);
		this.board[7][2] = new Piece(PieceType.Bishop, PieceColor.White);
		this.board[7][3] = new Piece(PieceType.Queen, PieceColor.White);
		this.board[7][4] = new Piece(PieceType.King, PieceColor.White);
		this.board[7][5] = new Piece(PieceType.Bishop, PieceColor.White);
		this.board[7][6] = new Piece(PieceType.Knight, PieceColor.White);
		this.board[7][7] = new Piece(PieceType.Rook, PieceColor.White);
	}

	// Menampilkan papan catur ke konsol
	display(): void {
		// Bersihkan konsol sebelum menampilkan papan yang baru
		console.clear();
		console.log("  a b c d e f g h");
		console.log("  -----------------");
		for (let i = 0; i < 8; i++) {
			let row = `${8 - i}|`;
			for (let j = 0; j < 8; j++) {
				const piece = this.board[i][j];
				row += `${piece ? piece.getSymbol() : " "} `;
			}
			console.log(`${row}|${8 - i}`);
		}
		console.log("  -----------------");
		console.log("  a b c d e f g h");
	}
}
