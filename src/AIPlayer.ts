import type { Board } from "./Board";
import type { Game } from "./Game";
import type { PieceColor } from "./Piece";

export type Move = {
	startRow: number;
	startCol: number;
	endRow: number;
	endCol: number;
};

export class AIPlayer {
	public findRandomMove(
		board: Board,
		playerColor: PieceColor,
		game: Game,
	): Move | null {
		const validMoves: Move[] = [];

		// Iterasi ke semua kotak di papan
		for (let startRow = 0; startRow < 8; startRow++) {
			for (let startCol = 0; startCol < 8; startCol++) {
				const piece = board.board[startRow][startCol];

				// Jika ada bidak dan warnanya sesuai dengan giliran pemain
				if (piece && piece.color === playerColor) {
					// Coba semua kemungkinan langkah dari posisi ini
					for (let endRow = 0; endRow < 8; endRow++) {
						for (let endCol = 0; endCol < 8; endCol++) {
							if (
								// biome-ignore lint/suspicious/noExplicitAny: Mengakses metode privat untuk validasi langkah AI
								(game as any).isValidMove(startRow, startCol, endRow, endCol)
							) {
								validMoves.push({ startRow, startCol, endRow, endCol });
							}
						}
					}
				}
			}
		}

		if (validMoves.length === 0) {
			return null; // Tidak ada langkah valid yang bisa diambil
		}

		// Pilih satu langkah secara acak dari semua langkah yang valid
		const randomIndex = Math.floor(Math.random() * validMoves.length);
		return validMoves[randomIndex];
	}
}
