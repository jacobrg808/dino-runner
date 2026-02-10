# Dino Runner

A classic infinite runner game with pixel art graphics, built with vanilla HTML, CSS, and JavaScript.

## How to Play
-   **PC**: Press `Spacebar` to jump.
-   **Goal**: Dodge obstacles and run as far as you can!
-   **Features**:
    -   High scores and leaderboard
    -   Unlockable characters
    -   Day/Night cycle
    -   Achievements

## Development

This project uses a build system to combine separate source files into a single portable HTML file.

### Prerequisites
-   Node.js installed

### Setup
1.  Install dependencies (none currently, but good practice):
    ```bash
    npm install
    ```

### Build
To generate the single-file game:
```bash
npm run build
```
This will create `dist/pixel_dino_game.html`.

### Project Structure
-   `src/index.html`: Main HTML structure.
-   `src/style.css`: All game styles.
-   `src/game.js`: Game logic and assets.
-   `scripts/build.js`: The build script.
-   `dist/`: Contains the generated portable game file.

## License
Copyright © 2026 Jacob Graham.

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
