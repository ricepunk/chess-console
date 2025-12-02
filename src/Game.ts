import * as readline from "node:readline";
import { AIPlayer, type Move } from "./AIPlayer";
import { Board } from "./Board";
import { GameMode } from "./GameMode";
import { Piece, PieceColor, PieceType } from "./Piece";

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

	private findKingPosition(
		color: PieceColor,
	): { row: number; col: number } | null {
		for (let r = 0; r < 8; r++) {
			for (let c = 0; c < 8; c++) {
				const piece = this.board.board[r][c];
				if (piece && piece.type === PieceType.King && piece.color === color) {
					return { row: r, col: c };
				}
			}
		}
		return null;
	}

	private isKingInCheck(color: PieceColor): boolean {
		const kingPos = this.findKingPosition(color);
		if (!kingPos) {
			return false; // Seharusnya tidak pernah terjadi dalam game normal
		}
		const opponentColor =
			color === PieceColor.White ? PieceColor.Black : PieceColor.White;
		return this.isSquareAttacked(kingPos.row, kingPos.col, opponentColor);
	}

	private isValidMove(
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
	): boolean {
		const piece = this.board.board[startRow][startCol];

		// 1. Pemeriksaan awal yang cepat
		if (
			!piece ||
			piece.color !== this.currentPlayer ||
			(this.board.board[endRow][endCol] &&
				this.board.board[endRow][endCol]?.color === this.currentPlayer)
		) {
			return false;
		}

		// 2. Periksa apakah langkah tersebut valid secara mekanis untuk bidak tersebut
		if (
			!this.isMoveMechanicallyValid(piece, startRow, startCol, endRow, endCol)
		) {
			return false;
		}

		// 3. Simulasikan langkah dan periksa apakah raja sendiri menjadi dalam keadaan skak
		const targetPiece = this.board.board[endRow][endCol];
		// Lakukan langkah sementara
		this.board.board[endRow][endCol] = piece;
		this.board.board[startRow][startCol] = null;

		const kingInCheck = this.isKingInCheck(this.currentPlayer);

		// Kembalikan langkah (sangat penting!)
		this.board.board[startRow][startCol] = piece;
		this.board.board[endRow][endCol] = targetPiece;

		if (kingInCheck) {
			console.log(
				"Langkah tidak valid: Raja Anda akan berada dalam keadaan skak.",
			);
			return false;
		}

		return true;
	}

	private isMoveMechanicallyValid(
		piece: Piece,
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
	): boolean {
		// Pemeriksaan batas papan dasar
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

		if (startRow === endRow && startCol === endCol) {
			console.log("Tidak dapat bergerak ke kotak yang sama.");
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

	public isSquareAttacked(
		row: number,
		col: number,
		attackerColor: PieceColor,
	): boolean {
		// Periksa serangan dari semua kemungkinan arah
		for (let r = 0; r < 8; r++) {
			for (let c = 0; c < 8; c++) {
				const attackingPiece = this.board.board[r][c];
				if (attackingPiece && attackingPiece.color === attackerColor) {
					// Simulasikan gerakan dari bidak penyerang ke kotak target
					// dan periksa apakah itu langkah yang valid (tanpa memvalidasi giliran saat ini).
					// Penting: Kita tidak bisa memanggil `isValidMove` secara langsung karena itu akan memeriksa `this.currentPlayer`.
					// Kita perlu mensimulasikan validasi langkah untuk bidak lawan.
					const originalPlayer = this.currentPlayer;
					this.currentPlayer = attackerColor; // Beralih sementara untuk validasi
					let canAttack = false;
					// We need to check for the piece type and call the correct validation method
					switch (attackingPiece.type) {
						case PieceType.Pawn: {
							// Logika serangan pion spesifik
							const pawnDirection =
								attackingPiece.color === PieceColor.White ? -1 : 1;
							if (
								r + pawnDirection === row &&
								(c + 1 === col || c - 1 === col)
							) {
								canAttack = true;
							}
							break;
						}
						// Untuk bidak lain, kita bisa menggunakan kembali logika gerakan mereka
						case PieceType.Rook:
							canAttack = this.isValidRookMove(attackingPiece, r, c, row, col);
							break;
						case PieceType.Knight:
							canAttack = this.isValidKnightMove(
								attackingPiece,
								r,
								c,
								row,
								col,
							);
							break;
						case PieceType.Bishop:
							canAttack = this.isValidBishopMove(
								attackingPiece,
								r,
								c,
								row,
								col,
							);
							break;
						case PieceType.Queen:
							canAttack = this.isValidQueenMove(attackingPiece, r, c, row, col);
							break;
						case PieceType.King: {
							// We use a simplified version for the king to avoid infinite recursion
							const rowDiff = Math.abs(row - r);
							const colDiff = Math.abs(col - c);
							if (rowDiff <= 1 && colDiff <= 1) {
								canAttack = true;
							}
							break;
						}
					}

					this.currentPlayer = originalPlayer; // Kembalikan giliran
					if (canAttack) {
						return true;
					}
				}
			}
		}
		return false;
	}

	private async executeMove(
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
	): Promise<void> {
		const piece = this.board.board[startRow][startCol];
		if (!piece) {
			return;
		}

		// Deteksi upaya rokade
		if (piece.type === PieceType.King && Math.abs(endCol - startCol) === 2) {
			// Pindahkan benteng
			if (endCol > startCol) {
				// Rokade sisi raja (kanan)
				const rook = this.board.board[startRow][7];
				if (rook) {
					this.board.board[startRow][5] = rook;
					this.board.board[startRow][7] = null;
					rook.hasMoved = true;
				}
			} else {
				// Rokade sisi ratu (kiri)
				const rook = this.board.board[startRow][0];
				if (rook) {
					this.board.board[startRow][3] = rook;
					this.board.board[startRow][0] = null;
					rook.hasMoved = true;
				}
			}
		}

		this.board.board[endRow][endCol] = piece;
		this.board.board[startRow][startCol] = null;
		piece.hasMoved = true; // Menandai bahwa bidak ini telah bergerak

		// Periksa promosi pion
		if (piece.type === PieceType.Pawn) {
			if (
				(piece.color === PieceColor.White && endRow === 0) ||
				(piece.color === PieceColor.Black && endRow === 7)
			) {
				await this.promotePawn(endRow, endCol);
			}
		}
	}

	private async promotePawn(row: number, col: number): Promise<void> {
		const pawn = this.board.board[row][col];
		if (!pawn || pawn.type !== PieceType.Pawn) {
			return;
		}

		console.log("Pion dipromosikan!");

		const isComputerTurn =
			this.gameMode === GameMode.ComputerVsComputer ||
			(this.gameMode === GameMode.PlayerVsComputer &&
				this.currentPlayer === PieceColor.Black) ||
			(this.gameMode === GameMode.ComputerVsPlayer &&
				this.currentPlayer === PieceColor.White);

		let promotionType: PieceType;

		if (isComputerTurn) {
			promotionType = PieceType.Queen; // AI selalu mempromosikan menjadi Ratu
			console.log("Komputer mempromosikan pion menjadi Ratu.");
		} else {
			const choice = await this.askQuestion(
				"Promosikan pion menjadi (Q, R, B, K): ",
			);
			switch (choice.trim().toUpperCase()) {
				case "Q":
					promotionType = PieceType.Queen;
					break;
				case "R":
					promotionType = PieceType.Rook;
					break;
				case "B":
					promotionType = PieceType.Bishop;
					break;
				case "K":
					promotionType = PieceType.Knight;
					break;
				default:
					console.log(
						"Pilihan tidak valid. Promosi menjadi Ratu secara default.",
					);
					promotionType = PieceType.Queen;
			}
		}

		const newPiece = new Piece(promotionType, pawn.color);
		newPiece.hasMoved = true; // Bidak yang dipromosikan dianggap telah bergerak
		this.board.board[row][col] = newPiece;
	}

	private switchPlayer(): void {
		this.currentPlayer =
			this.currentPlayer === PieceColor.White
				? PieceColor.Black
				: PieceColor.White;
	}

	private getAllValidMovesForColor(color: PieceColor): Move[] {
		const validMoves: Move[] = [];
		for (let r1 = 0; r1 < 8; r1++) {
			for (let c1 = 0; c1 < 8; c1++) {
				const piece = this.board.board[r1][c1];
				if (piece && piece.color === color) {
					for (let r2 = 0; r2 < 8; r2++) {
						for (let c2 = 0; c2 < 8; c2++) {
							// Simulasikan giliran untuk isValidMove
							const originalPlayer = this.currentPlayer;
							this.currentPlayer = color;
							if (this.isValidMove(r1, c1, r2, c2)) {
								validMoves.push({
									startRow: r1,
									startCol: c1,
									endRow: r2,
									endCol: c2,
								});
							}
							this.currentPlayer = originalPlayer;
						}
					}
				}
			}
		}
		return validMoves;
	}

	async play(): Promise<void> {
		console.log("Game Catur Dimulai!");
		this.board.display();

		while (true) {
			console.log(`Sekarang giliran ${this.currentPlayer}.`);

			// Periksa kondisi akhir permainan (Skakmat/Stalemate)
			const allValidMoves = this.getAllValidMovesForColor(this.currentPlayer);
			if (allValidMoves.length === 0) {
				if (this.isKingInCheck(this.currentPlayer)) {
					this.board.display();
					console.log(
						`SKAKMAT! ${this.currentPlayer === PieceColor.White ? PieceColor.Black : PieceColor.White} menang!`,
					);
				} else {
					this.board.display();
					console.log("STALEMATE! Permainan berakhir seri.");
				}
				break; // Akhiri permainan
			}

			let move: Move | null = null;
			const isComputerTurn =
				this.gameMode === GameMode.ComputerVsComputer ||
				(this.gameMode === GameMode.PlayerVsComputer &&
					this.currentPlayer === PieceColor.Black) ||
				(this.gameMode === GameMode.ComputerVsPlayer &&
					this.currentPlayer === PieceColor.White);

			if (isComputerTurn) {
				const originalLog = console.log;
				console.log = () => {};
				move = this.aiPlayer.findRandomMove(
					this.board,
					this.currentPlayer,
					this,
				);
				console.log = originalLog;

				if (move) {
					const from = `${String.fromCharCode(97 + move.startCol)}${8 - move.startRow}`;
					const to = `${String.fromCharCode(97 + move.endCol)}${8 - move.endRow}`;
					console.log(
						`Komputer (${this.currentPlayer}) melangkah: ${from} ${to}`,
					);
				}
				await new Promise((resolve) => setTimeout(resolve, 500));
			} else {
				const input = await this.askQuestion(
					'Masukkan langkahmu (contoh: "b2 b3" atau "6,1 5,1"): ',
				);
				move = this.parseInput(input);
				if (!move) {
					continue;
				}
			}

			if (!move) {
				console.log(
					`Tidak ada langkah valid untuk ${this.currentPlayer}. Ini aneh, seharusnya sudah ditangani oleh deteksi stalemate.`,
				);
				continue;
			}

			const { startRow, startCol, endRow, endCol } = move;

			if (this.isValidMove(startRow, startCol, endRow, endCol)) {
				await this.executeMove(startRow, startCol, endRow, endCol);
				this.board.display();

				this.switchPlayer();

				// Beri tahu pemain jika mereka dalam keadaan skak
				if (this.isKingInCheck(this.currentPlayer)) {
					console.log(`SKAK! Raja ${this.currentPlayer} dalam bahaya!`);
				}
			} else {
				// isValidMove sudah menampilkan log error spesifik
				if (isComputerTurn) {
					console.log("AI mencoba langkah yang tidak valid. Ini aneh.");
				}
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

	public isValidKingMove(
		piece: Piece,
		startRow: number,
		startCol: number,
		endRow: number,
		endCol: number,
	): boolean {
		const rowDiff = Math.abs(endRow - startRow);
		const colDiff = Math.abs(endCol - startCol);

		// Gerakan normal satu kotak
		if (rowDiff <= 1 && colDiff <= 1) {
			return true;
		}

		// Logika Rokade
		if (
			rowDiff === 0 &&
			colDiff === 2 &&
			!piece.hasMoved &&
			startRow === endRow
		) {
			const opponentColor =
				piece.color === PieceColor.White ? PieceColor.Black : PieceColor.White;

			// Raja tidak boleh sedang dalam keadaan skak
			if (this.isSquareAttacked(startRow, startCol, opponentColor)) {
				console.log("Tidak bisa rokade saat sedang skak.");
				return false;
			}

			// Rokade sisi raja (kanan)
			if (endCol > startCol) {
				const rook = this.board.board[startRow][7];
				if (rook && rook.type === PieceType.Rook && !rook.hasMoved) {
					// Jalur harus bersih & tidak diserang
					if (
						this.isPathClear(startRow, startCol, startRow, 7) &&
						!this.isSquareAttacked(startRow, startCol + 1, opponentColor) &&
						!this.isSquareAttacked(startRow, startCol + 2, opponentColor)
					) {
						return true;
					}
				}
			}
			// Rokade sisi ratu (kiri)
			else {
				const rook = this.board.board[startRow][0];
				if (rook && rook.type === PieceType.Rook && !rook.hasMoved) {
					// Jalur harus bersih & tidak diserang
					if (
						this.isPathClear(startRow, startCol, startRow, 0) &&
						!this.isSquareAttacked(startRow, startCol - 1, opponentColor) &&
						!this.isSquareAttacked(startRow, startCol - 2, opponentColor)
					) {
						return true;
					}
				}
			}
		}

		console.log("Langkah raja tidak valid.");
		return false;
	}

	close(): void {
		this.rl.close();
	}
}
