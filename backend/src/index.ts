import WebSocket, { WebSocketServer } from "ws";
import { GameManager } from "./GameManager";

const PORT = 8080;

const wss = new WebSocketServer({ port: PORT });

const gameManager = new GameManager();

wss.on("connection", (ws: WebSocket) => {
  gameManager.addPlayer(ws);
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
