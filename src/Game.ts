import * as readline from "node:readline";
import { AIPlayer, type Move } from "./AIPlayer";
import { Board } from "./Board";
import { GameMode } from "./GameMode";
import { type Piece, PieceColor, PieceType } from "./Piece";

export class Game {
	private board: Board;
	private currentPlayer: PieceColor;
	private rl: readline.Interface;
	private gameMode: GameMode;
	private aiPlayer: AIPlayer;

	constructor(
		gameMode: GameMode = GameMode.PlayerVsPlayer,
		input: NodeJS.ReadableStream = process.stdin,
		output: NodeJS.WritableStream = process.stdout,
	) {
		this.board = new Board();
		this.currentPlayer = PieceColor.White; // Putih memulai lebih dulu
		this.rl = readline.createInterface({
			input,
			output,
		});
		this.gameMode = gameMode;
		this.aiPlayer = new AIPlayer();
	}

	private parseInput(input: string): {
		startRow: number;
		startCol: number;
		endRow: number;
		endCol: number;
	} | null {
		const parts = input.trim().split(" ");
		if (parts.length !== 2) {
			console.log(
				'Format input tidak valid. Harusnya "start_coord end_coord" (contoh: "1,3 2,3" atau "b2 b3").',
			);
			return null;
		}

		const parseCoordinate = (
			coord: string,
		): { row: number; col: number } | null => {
			// Menangani input numerik (contoh: "1,3")
			const numMatch = coord.match(/^(\d),(\d)$/);
			if (numMatch) {
				const row = parseInt(numMatch[1], 10);
				const col = parseInt(numMatch[2], 10);
				if (row >= 0 && row < 8 && col >= 0 && col < 8) {
					return { row, col };
				}
			}

			// Menangani notasi catur (contoh: "b2")
			const algMatch = coord.match(/^([a-h])([1-8])$/i);
			if (algMatch) {
				const col = algMatch[1].toLowerCase().charCodeAt(0) - "a".charCodeAt(0);
				const row = 8 - parseInt(algMatch[2], 10); // Peringkat baris catur adalah 1-8, yang dipetakan ke indeks array 0-7
				return { row, col };
			}

			return null;
		};

		const startCoord = parseCoordinate(parts[0]);
		const endCoord = parseCoordinate(parts[1]);

		if (!startCoord || !endCoord) {
			console.log("Format koordinat tidak valid.");
			return null;
		}

		return {
			startRow: startCoord.row,
			startCol: startCoord.col,
			endRow: endCoord.row,
			endCol: endCoord.col,
		};
	}

	private isValidMove(
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
	): boolean {
		// Pemeriksaan batas papan dasar (sudah ada di parseCoordinate, tapi bagus sebagai pemeriksaan ganda)
		if (
			startRow < 0 ||
			startRow >= 8 ||
			startCol < 0 ||
			startCol >= 8 ||
			endRow < 0 ||
			endRow >= 8 ||
			endCol < 0 ||
			endCol >= 8
		) {
			console.log("Langkah keluar dari papan.");
			return false;
		}

		const piece = this.board.board[startRow][startCol];
		const targetPiece = this.board.board[endRow][endCol];

		if (!piece) {
			console.log("Tidak ada bidak di posisi awal.");
			return false;
		}

		if (piece.color !== this.currentPlayer) {
			console.log(`Sekarang giliran ${this.currentPlayer}.`);
			return false;
		}

		if (startRow === endRow && startCol === endCol) {
			console.log("Tidak dapat bergerak ke kotak yang sama.");
			return false;
		}

		// Tidak dapat memakan bidak sendiri
		if (targetPiece && targetPiece.color === piece.color) {
			console.log("Tidak dapat memakan bidak sendiri.");
			return false;
		}

		// Mendelegasikan ke validasi khusus per bidak
		switch (piece.type) {
			case PieceType.Pawn:
				return this.isValidPawnMove(piece, startRow, startCol, endRow, endCol);
			case PieceType.Rook:
				return this.isValidRookMove(piece, startRow, startCol, endRow, endCol);
			case PieceType.Knight:
				return this.isValidKnightMove(
					piece,
					startRow,
					startCol,
					endRow,
					endCol,
				);
			case PieceType.Bishop:
				return this.isValidBishopMove(
					piece,
					startRow,
					startCol,
					endRow,
					endCol,
				);
			case PieceType.Queen:
				return this.isValidQueenMove(piece, startRow, startCol, endRow, endCol);
			case PieceType.King:
				return this.isValidKingMove(piece, startRow, startCol, endRow, endCol);
			default:
				return false;
		}
	}

	private executeMove(
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
	): { kingCaptured: boolean } {
		const piece = this.board.board[startRow][startCol];
		let kingCaptured = false;

		if (piece) {
			const capturedPiece = this.board.board[endRow][endCol];
			if (capturedPiece && capturedPiece.type === PieceType.King) {
				kingCaptured = true;
			}
			this.board.board[endRow][endCol] = piece;
			this.board.board[startRow][startCol] = null;
			piece.hasMoved = true; // Menandai bahwa bidak ini telah bergerak
		}
		return { kingCaptured };
	}

	private switchPlayer(): void {
		this.currentPlayer =
			this.currentPlayer === PieceColor.White
				? PieceColor.Black
				: PieceColor.White;
	}

	async play(): Promise<void> {
		console.log("Game Catur Dimulai!");
		this.board.display();

		while (true) {
			// Loop utama permainan
			console.log(`Sekarang giliran ${this.currentPlayer}.`);

			let move: Move | null = null;

			if (this.gameMode === GameMode.PlayerVsPlayer) {
				const input = await this.askQuestion(
					'Masukkan langkahmu (contoh: "b2 b3" atau "6,1 5,1"): ',
				);
				move = this.parseInput(input);
				if (!move) {
					continue;
				}
			} else if (this.gameMode === GameMode.ComputerVsComputer) {
				// Matikan console.log sementara agar tidak mengotori output saat AI mencari langkah
				const originalLog = console.log;
				console.log = () => {};

				move = this.aiPlayer.findRandomMove(
					this.board,
					this.currentPlayer,
					this,
				);

				// Kembalikan console.log
				console.log = originalLog;

				if (move) {
					const from = `${String.fromCharCode(97 + move.startCol)}${8 - move.startRow}`;
					const to = `${String.fromCharCode(97 + move.endCol)}${8 - move.endRow}`;
					console.log(
						`Komputer (${this.currentPlayer}) melangkah: ${from} ${to}`,
					);
				}
				// Tambahkan delay kecil agar game tidak berjalan terlalu cepat
				await new Promise((resolve) => setTimeout(resolve, 500));
			}

			if (!move) {
				console.log(
					`Tidak ada langkah valid untuk ${this.currentPlayer}. Permainan berakhir seri (Stalemate).`,
				);
				break;
			}

			const { startRow, startCol, endRow, endCol } = move;

			if (this.isValidMove(startRow, startCol, endRow, endCol)) {
				const { kingCaptured } = this.executeMove(
					startRow,
					startCol,
					endRow,
					endCol,
				);
				this.board.display();

				if (kingCaptured) {
					console.log(
						`SKAKMAT! ${this.currentPlayer} menang karena Raja lawan termakan!`,
					);
					break; // Mengakhiri permainan
				}
				this.switchPlayer();
			} else {
				// 'else' ini berarti langkahnya tidak valid.

				// Hanya tampilkan peringatan khusus jika ini adalah giliran AI yang membuat kesalahan.
				if (this.gameMode === GameMode.ComputerVsComputer) {
					console.log("AI mencoba langkah yang tidak valid. Ini aneh.");
				}

				// Untuk pemain manusia, pesan error spesifik (misalnya "Langkah pion salah")
				// sudah ditampilkan di dalam isValidMove, jadi kita tidak perlu melakukan apa-apa lagi di sini.
				// Loop akan otomatis berlanjut untuk pemain yang sama.
			}
		}
		this.close();
	}

	private askQuestion(query: string): Promise<string> {
		return new Promise((resolve) => this.rl.question(query, resolve));
	}

	private isValidPawnMove(
		piece: Piece,
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
	): boolean {
		const rowDiff = endRow - startRow;
		const colDiff = Math.abs(endCol - startCol);
		const direction = piece.color === PieceColor.White ? -1 : 1; // Putih bergerak ke atas (baris berkurang), Hitam ke bawah (baris bertambah)

		const targetPiece = this.board.board[endRow][endCol];

		// Gerakan maju normal 1 kotak
		if (colDiff === 0 && rowDiff === direction && !targetPiece) {
			return true;
		}

		// Gerakan maju awal 2 kotak
		if (
			colDiff === 0 &&
			rowDiff === 2 * direction &&
			!piece.hasMoved &&
			!targetPiece
		) {
			// Periksa jika kotak di antaranya juga kosong
			const inBetweenRow = startRow + direction;
			if (!this.board.board[inBetweenRow][startCol]) {
				return true;
			}
		}

		// Memakan bidak secara diagonal
		if (
			colDiff === 1 &&
			rowDiff === direction &&
			targetPiece &&
			targetPiece.color !== piece.color
		) {
			return true;
		}

		console.log("Langkah pion tidak valid.");
		return false;
	}

	private isPathClear(
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
	): boolean {
		// Jalur horizontal
		if (startRow === endRow) {
			const minCol = Math.min(startCol, endCol);
			const maxCol = Math.max(startCol, endCol);
			for (let col = minCol + 1; col < maxCol; col++) {
				if (this.board.board[startRow][col] !== null) {
					return false;
				}
			}
		}
		// Jalur vertikal
		else if (startCol === endCol) {
			const minRow = Math.min(startRow, endRow);
			const maxRow = Math.max(startRow, endRow);
			for (let row = minRow + 1; row < maxRow; row++) {
				if (this.board.board[row][startCol] !== null) {
					return false;
				}
			}
		}
		// Jalur diagonal (untuk gajah dan ratu)
		else if (Math.abs(startRow - endRow) === Math.abs(startCol - endCol)) {
			const rowStep = endRow > startRow ? 1 : -1;
			const colStep = endCol > startCol ? 1 : -1;

			let currentRow = startRow + rowStep;
			let currentCol = startCol + colStep;

			while (currentRow !== endRow && currentCol !== endCol) {
				// Iterasi hingga satu langkah sebelum akhir
				if (this.board.board[currentRow][currentCol] !== null) {
					return false; // Ditemukan penghalang
				}
				currentRow += rowStep;
				currentCol += colStep;
			}
		}
		return true;
	}

	private isValidRookMove(
		_piece: Piece,
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
	): boolean {
		// Benteng bergerak lurus horizontal atau vertikal
		if (startRow === endRow || startCol === endCol) {
			if (this.isPathClear(startRow, startCol, endRow, endCol)) {
				return true;
			}
		}
		console.log("Langkah benteng tidak valid.");
		return false;
	}

	private isValidKnightMove(
		_piece: Piece,
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
	): boolean {
		const rowDiff = Math.abs(endRow - startRow);
		const colDiff = Math.abs(endCol - startCol);

		// Kuda bergerak dalam bentuk L: 2 kotak di satu arah (baris atau kolom) dan 1 kotak tegak lurus.
		if ((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)) {
			return true;
		}

		console.log("Langkah kuda tidak valid.");
		return false;
	}

	private isValidBishopMove(
		_piece: Piece,
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
	): boolean {
		// Gajah bergerak diagonal
		if (Math.abs(startRow - endRow) === Math.abs(startCol - endCol)) {
			if (this.isPathClear(startRow, startCol, endRow, endCol)) {
				return true;
			}
		}
		console.log("Langkah gajah tidak valid.");
		return false;
	}

	private isValidQueenMove(
		_piece: Piece,
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
	): boolean {
		// Ratu bergerak lurus horizontal, vertikal, atau diagonal
		if (
			startRow === endRow ||
			startCol === endCol ||
			Math.abs(startRow - endRow) === Math.abs(startCol - endCol)
		) {
			if (this.isPathClear(startRow, startCol, endRow, endCol)) {
				return true;
			}
		}
		console.log("Langkah ratu tidak valid.");
		return false;
	}

	private isValidKingMove(
		_piece: Piece,
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
	): boolean {
		const rowDiff = Math.abs(endRow - startRow);
		const colDiff = Math.abs(endCol - startCol);

		// Raja bergerak satu kotak ke segala arah
		if (rowDiff <= 1 && colDiff <= 1) {
			// Pemeriksaan tambahan untuk rokade dan skak/skakmat akan ditempatkan di sini
			return true;
		}

		console.log("Langkah raja tidak valid.");
		return false;
	}

	close(): void {
		this.rl.close();
	}
}
