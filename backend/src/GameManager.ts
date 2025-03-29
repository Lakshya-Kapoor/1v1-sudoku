import { Board, Difficulty } from "sudoku-core";
import { Game } from "./Game";
import { Player } from "./types";

type waitingPlayers = {
  easy?: Player;
  medium?: Player;
  hard?: Player;
  expert?: Player;
  master?: Player;
};

type Message =
  | { type: "join"; difficulty: Difficulty }
  | { type: "updateBoard"; board: Board };

export class GameManager {
  private players: Player[];
  private games: Game[];
  private waitingPlayer: waitingPlayers;

  constructor() {
    this.players = [];
    this.games = [];
    this.waitingPlayer = {};
  }

  public addPlayer(player: Player) {
    this.players.push(player);
    this.addMessageHandler(player);
  }

  private addMessageHandler(player: Player) {
    player.on("message", (data) => {
      const message: Message = JSON.parse(data.toString());

      if (message.type === "join") {
        const { difficulty } = message;
        if (this.waitingPlayer[difficulty]) {
          const game = new Game(
            this.waitingPlayer[difficulty],
            player,
            difficulty
          );
          this.games.push(game);
          this.waitingPlayer[difficulty], player;
          this.waitingPlayer[difficulty] = undefined;
        } else {
          this.waitingPlayer[message.difficulty] = player;
        }
      } else if (message.type === "updateBoard") {
        const game = this.games.find(
          (game) => game.player1 === player || game.player2 === player
        );

        if (game) {
          game.updateBoard(player, message.board);

          // checking if the game is finished
          if (game.gameOver) {
            this.games = this.games.filter((g) => g !== game);
          }
        }
      }
    });
  }
}
