import { Board, Difficulty, generate, solve } from "sudoku-core";
import { Player } from "./types";

export class Game {
  public player1: Player;
  public player2: Player;
  private readonly initialCount: number;
  private initialBoard: Board;
  private solvedBoard: Board;

  private finishedCount: number = 0;
  public gameOver: boolean = false;

  constructor(player1: Player, player2: Player, difficulty: Difficulty) {
    this.player1 = player1;
    this.player2 = player2;
    this.initialBoard = generate(difficulty);
    this.solvedBoard = solve(this.initialBoard).board!;

    this.initialCount = this.initialBoard.filter(
      (cell) => cell !== null
    ).length;

    this.sendInitialBoard();
  }

  private sendInitialBoard() {
    this.player1.send(
      JSON.stringify({ type: "initialBoard", board: this.initialBoard })
    );
    this.player2.send(
      JSON.stringify({ type: "initialBoard", board: this.initialBoard })
    );
  }

  public updateBoard(player: Player, updatedBoard: Board) {
    let count = 0;
    for (let i = 0; i < 81; i++) {
      if (this.solvedBoard[i] === updatedBoard[i]) {
        count++;
      }
    }

    const percentage =
      ((count - this.initialCount) / (81 - this.initialCount)) * 100;

    if (player == this.player1) {
      this.player2.send(
        JSON.stringify({ type: "updateProgressBar", percentage })
      );
    } else {
      this.player1.send(
        JSON.stringify({ type: "updateProgressBar", percentage })
      );
    }

    // letting the player know they won the game
    if (percentage === 100) {
      this.finishedCount++;
      player.send(JSON.stringify({ type: "gameOver" }));
      if (this.player1 === player) {
        this.player2.send(JSON.stringify({ type: "youLost" }));
      } else {
        this.player1.send(JSON.stringify({ type: "youLost" }));
      }
    }

    if (this.finishedCount === 2) {
      this.gameOver = true;
    }
  }
}
