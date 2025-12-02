import { Game } from "./Game";

async function main() {
	const game = new Game();
	await game.play();
	game.close(); // Pastikan readline ditutup pas game selesai
}

main();
