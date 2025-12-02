import { Game } from "./Game";
import { GameMode } from "./GameMode";

async function main() {
	// Buat game dalam mode Komputer vs Komputer
	const game = new Game(GameMode.ComputerVsComputer);
	await game.play();
}

main();
