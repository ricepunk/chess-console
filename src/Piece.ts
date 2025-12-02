export enum PieceType {
	Pawn = "Pawn",
	Rook = "Rook",
	Knight = "Knight",
	Bishop = "Bishop",
	Queen = "Queen",
	King = "King",
}

export enum PieceColor {
	White = "White",
	Black = "Black",
}

export class Piece {
	public hasMoved: boolean = false;
	constructor(
		public type: PieceType,
		public color: PieceColor,
	) {}

	getSymbol(): string {
		switch (this.type) {
			case PieceType.Pawn:
				return this.color === PieceColor.White ? "♙" : "♟";
			case PieceType.Rook:
				return this.color === PieceColor.White ? "♖" : "♜";
			case PieceType.Knight:
				return this.color === PieceColor.White ? "♘" : "♞";
			case PieceType.Bishop:
				return this.color === PieceColor.White ? "♗" : "♝";
			case PieceType.Queen:
				return this.color === PieceColor.White ? "♕" : "♛";
			case PieceType.King:
				return this.color === PieceColor.White ? "♔" : "♚";
			default:
				return "";
		}
	}
}
