import { Piece, PieceColor, PieceType } from "../src/Piece";

describe("Piece", () => {
	it("should correctly return symbol for White Pawn", () => {
		const pawn = new Piece(PieceType.Pawn, PieceColor.White);
		expect(pawn.getSymbol()).toBe("♙");
	});

	it("should correctly return symbol for Black King", () => {
		const king = new Piece(PieceType.King, PieceColor.Black);
		expect(king.getSymbol()).toBe("♚");
	});

	it("should have hasMoved property initialized to false", () => {
		const piece = new Piece(PieceType.Pawn, PieceColor.White);
		expect(piece.hasMoved).toBe(false);
	});
});
