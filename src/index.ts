import { Game } from "./Game";

async function main() {
	const game = new Game();
	await game.play();
	game.close(); // Memastikan antarmuka readline ditutup saat permainan berakhir
}

main();
