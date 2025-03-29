import { useState, useEffect, useCallback, useRef } from "react";
import { Grid3X3, ChevronDown } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

function App() {
  const [difficulty, setDifficulty] = useState("medium");
  const [isOpen, setIsOpen] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [board, setBoard] = useState(Array(81).fill(null));
  const [initialBoard, setInitialBoard] = useState(Array(81).fill(null));
  const [opponentProgress, setOpponentProgress] = useState(0);

  const socket = useRef<WebSocket | null>(null);

  const difficulties = {
    easy: { name: "Easy", color: "text-green-400" },
    medium: { name: "Medium", color: "text-yellow-400" },
    hard: { name: "Hard", color: "text-red-400" },
    expert: { name: "Expert", color: "text-purple-400" },
    master: { name: "Master", color: "text-blue-400" },
  };

  const triggerConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 1000,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      origin: { x: 0.2, y: 0.7 },
    });

    fire(0.2, {
      spread: 60,
      origin: { x: 0.5, y: 0.7 },
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      origin: { x: 0.8, y: 0.7 },
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      origin: { x: 0.5, y: 0.7 },
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.7 },
    });
  }, []);

  // setting up websockets
  useEffect(() => {
    if (!showGame) return;

    socket.current = new WebSocket("ws://localhost:8080");

    socket.current.onopen = () => {
      console.log("Connected to the server");
      socket.current?.send(JSON.stringify({ type: "join", difficulty }));
    };

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "initialBoard") {
        setInitialBoard(data.board);
        setBoard(data.board);
        setGameLoading(false);
      } else if (data.type === "updateProgressBar") {
        setOpponentProgress(data.percentage);
      } else if (data.type === "gameOver") {
        alert("Game Over! You won!");
        triggerConfetti();
      } else if (data.type === "youLost") {
        alert("You lost! :(");
      }
    };

    socket.current.onclose = () => {
      console.log("Disconnected from the server");
    };

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [showGame, difficulty, triggerConfetti]);

  const handleCellChange = (index: number, value: string) => {
    if (initialBoard[index] !== null) return;

    const newValue = value === "" ? null : parseInt(value) || null;
    if (newValue !== null && (newValue < 1 || newValue > 9)) return;

    const newBoard = [...board];
    newBoard[index] = newValue;
    setBoard(newBoard);

    socket.current?.send(
      JSON.stringify({ type: "updateBoard", board: newBoard })
    );
  };

  const startGame = () => {
    setGameLoading(true);
    setShowGame(true);
  };

  const isDarkerGrid = (row: number, col: number) => {
    return (
      (row === 0 && col === 0) ||
      (row === 0 && col === 2) ||
      (row === 1 && col === 1) ||
      (row === 2 && col === 0) ||
      (row === 2 && col === 2)
    );
  };

  if (gameLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 gap-4">
        <div className="text-3xl font-black">Waiting for player to join</div>
        <div className="flex space-x-1 justify-center items-center h-20">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-3 h-3 bg-blue-500 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (showGame) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Sudoku Master</h1>
            <span
              className={`text-lg font-medium ${
                difficulties[difficulty as keyof typeof difficulties].color
              }`}
            >
              {difficulties[difficulty as keyof typeof difficulties].name} Mode
            </span>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">
                Opponent's Progress
              </span>
              <span className="text-sm font-medium text-gray-400">
                {Math.round(opponentProgress)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out"
                style={{ width: `${opponentProgress}%` }}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl">
              <div className="grid grid-cols-9 gap-[1px] bg-gray-500 p-[2px] rounded-lg">
                {Array(81)
                  .fill(null)
                  .map((_, index) => {
                    const row = Math.floor(index / 9);
                    const col = index % 9;
                    const subgridRow = Math.floor(row / 3);
                    const subgridCol = Math.floor(col / 3);
                    const isDarker = isDarkerGrid(subgridRow, subgridCol);

                    return (
                      <input
                        key={index}
                        type="text"
                        value={board[index] || ""}
                        onChange={(e) =>
                          handleCellChange(index, e.target.value)
                        }
                        className={`
                          w-10 h-10 text-center text-xl font-semibold
                          focus:outline-none
                          transition-all duration-200 ease-in-out
                          border border-gray-600 hover:border-gray-300
                          ${isDarker ? "bg-gray-800" : "bg-gray-700"}
                          ${
                            initialBoard[index] !== null
                              ? "text-gray-200 font-bold"
                              : "text-gray-400"
                          }
                        `}
                        maxLength={1}
                        readOnly={initialBoard[index] !== null}
                      />
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Grid3X3 className="h-16 w-16 text-indigo-500" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Sudoku Master
          </h1>
          <p className="text-gray-400">
            Challenge your mind with classic number puzzles
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full bg-gray-800 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-gray-700 transition-colors"
            >
              <span
                className={
                  difficulties[difficulty as keyof typeof difficulties].color
                }
              >
                {difficulties[difficulty as keyof typeof difficulties].name}
              </span>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  isOpen ? "transform rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="absolute mt-1 w-full bg-gray-800 rounded-lg shadow-lg z-10">
                {Object.entries(difficulties).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setDifficulty(key);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${value.color}`}
                  >
                    {value.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={startGame}
            className="w-full bg-indigo-600 rounded-lg px-4 py-3 font-medium hover:bg-indigo-500 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Join Game</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
