import { Game } from "./Game";
import { GameMode } from "./GameMode";

async function main() {
	// Buat game dalam mode Pemain vs Komputer
	// Manusia akan bermain sebagai Putih
	const game = new Game(GameMode.PlayerVsComputer);
	await game.play();
}

main();
