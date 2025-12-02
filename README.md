# Chess Console Game

This is a fully functional console-based chess game implemented in TypeScript and run on Node.js.

## Objectives

This project fulfills the following objectives:
*   A console-based chess game.
*   Implementation of all basic chess functionality, input handling, and display.
*   A comprehensive suite of unit tests and validations to ensure correct gameplay.

## Features

*   **Standard 8x8 Board**: The game initializes a standard 8x8 chessboard with all pieces in their correct starting positions, represented by Unicode symbols.
*   **Interactive Gameplay**: Players take turns (White and Black) to move their pieces. The board is redisplayed after each move.
*   **Flexible Input Handling**: Supports two types of coordinate input for moves:
    *   **Algebraic Notation**: e.g., `e2 e4`
    *   **Numeric Notation**: e.g., `6,4 4,4` (for the same `e2 e4` move)
*   **Comprehensive Move Validation**: The game validates all moves according to standard chess rules for each piece type:
    *   Pawn (including initial two-step move and diagonal captures)
    *   Rook
    *   Knight
    *   Bishop
    *   Queen
    *   King
    *   Also includes validation for path obstruction for sliding pieces (Rooks, Bishops, Queens).
*   **Win Condition**: The game ends when a player captures the opponent's King.
*   **Thoroughly Tested**: The project includes a suite of **55 unit tests** using Jest, covering:
    *   Correct board and piece initialization.
    *   Input parsing and validation.
    *   Valid and invalid move logic for every piece type.
    *   The resource management of the test suite has been optimized to prevent open handles and memory leaks.

## How to Run

1.  **Install Dependencies**:
    Make sure you have Node.js and npm installed. Then, install the project dependencies:
    ```bash
    npm install
    ```

2.  **Build the Project**:
    Compile the TypeScript code into JavaScript:
    ```bash
    npx tsc
    ```
    This will create a `dist` directory with the compiled JavaScript files.

3.  **Start the Game**:
    Run the following command to start the interactive game:
    ```bash
    npm start
    ```

## How to Run Tests

The project uses Jest for unit testing.

1.  **Run All Tests**:
    This will execute all 55 tests and show a clean output, as console logs are suppressed during testing.
    ```bash
    npm test
    ```

2.  **Run Specific Tests (e.g., Board tests)**:
    ```bash
    npx jest tests/Board.test.ts
    ```

## Development

*   **TypeScript**: The game logic is written in TypeScript.
*   **Jest**: Unit tests are written using the Jest testing framework.
*   **Biome**: Code formatting and linting are enforced using Biome.