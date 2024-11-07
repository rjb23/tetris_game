import React, { useState, useEffect, useCallback } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const TICK_SPEED = 1000;

const TETROMINOS = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: 'bg-cyan-500'
  },
  J: {
    shape: [[1, 0, 0], [1, 1, 1]],
    color: 'bg-blue-500'
  },
  L: {
    shape: [[0, 0, 1], [1, 1, 1]],
    color: 'bg-orange-500'
  },
  O: {
    shape: [[1, 1], [1, 1]],
    color: 'bg-yellow-500'
  },
  S: {
    shape: [[0, 1, 1], [1, 1, 0]],
    color: 'bg-green-500'
  },
  T: {
    shape: [[0, 1, 0], [1, 1, 1]],
    color: 'bg-purple-500'
  },
  Z: {
    shape: [[1, 1, 0], [0, 1, 1]],
    color: 'bg-red-500'
  }
};

const TetrisGame = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  function createEmptyBoard() {
    return Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(null));
  }

  function getRandomPiece() {
    const pieces = Object.keys(TETROMINOS);
    const tetromino = TETROMINOS[pieces[Math.floor(Math.random() * pieces.length)]];
    return {
      shape: tetromino.shape,
      color: tetromino.color
    };
  }

  const checkCollision = useCallback((piece, pos) => {
    if (!piece) return false;
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          
          if (
            newX < 0 || 
            newX >= BOARD_WIDTH ||
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && board[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, [board]);

  const rotatePiece = useCallback(() => {
    if (!currentPiece) return;
    
    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );
    
    const newPiece = {
      ...currentPiece,
      shape: rotated
    };
    
    if (!checkCollision(newPiece, position)) {
      setCurrentPiece(newPiece);
    }
  }, [currentPiece, position, checkCollision]);

  const moveHorizontal = useCallback((direction) => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const newPos = { ...position, x: position.x + direction };
    if (!checkCollision(currentPiece, newPos)) {
      setPosition(newPos);
    }
  }, [currentPiece, position, checkCollision, gameOver, isPaused]);

  const moveDown = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    const newPos = { ...position, y: position.y + 1 };
    if (!checkCollision(currentPiece, newPos)) {
      setPosition(newPos);
    } else {
      // Merge piece with board
      const newBoard = [...board];
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell && position.y + y >= 0) {
            newBoard[position.y + y][position.x + x] = currentPiece.color;
          }
        });
      });
      
      // Check for completed lines
      let completedLines = 0;
      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (newBoard[y].every(cell => cell)) {
          newBoard.splice(y, 1);
          newBoard.unshift(Array(BOARD_WIDTH).fill(null));
          completedLines++;
          y++;
        }
      }
      
      setScore(prev => prev + completedLines * 100);
      setBoard(newBoard);
      
      // Spawn new piece
      const newPiece = getRandomPiece();
      const newPosition = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 };
      
      if (checkCollision(newPiece, newPosition)) {
        setGameOver(true);
      } else {
        setCurrentPiece(newPiece);
        setPosition(newPosition);
      }
    }
  }, [currentPiece, position, board, checkCollision, gameOver, isPaused]);

  useEffect(() => {
    if (!currentPiece) {
      const piece = getRandomPiece();
      setCurrentPiece(piece);
      setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
    }
    
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') moveHorizontal(-1);
      if (e.key === 'ArrowRight') moveHorizontal(1);
      if (e.key === 'ArrowDown') moveDown();
      if (e.key === 'ArrowUp') rotatePiece();
      if (e.key === 'p') setIsPaused(prev => !prev);
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    const gameLoop = setInterval(() => {
      if (!isPaused) {
        moveDown();
      }
    }, TICK_SPEED);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearInterval(gameLoop);
    };
  }, [currentPiece, moveDown, moveHorizontal, rotatePiece, isPaused]);

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPiece(null);
    setPosition({ x: 0, y: 0 });
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  // Render game board with current piece
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    
    if (currentPiece) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell && position.y + y >= 0) {
            displayBoard[position.y + y][position.x + x] = currentPiece.color;
          }
        });
      });
    }
    
    return displayBoard;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-2xl font-bold">Score: {score}</div>
      <div className="relative">
        <div className="grid gap-px bg-gray-800 p-1">
          {renderBoard().map((row, y) => (
            <div key={y} className="flex">
              {row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`w-6 h-6 border border-gray-700 ${cell || 'bg-gray-900'}`}
                />
              ))}
            </div>
          ))}
        </div>
        
        {(gameOver || isPaused) && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-2xl mb-4">
                {gameOver ? 'Game Over!' : 'Paused'}
              </div>
              <button
                onClick={gameOver ? resetGame : () => setIsPaused(false)}
                className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
              >
                {gameOver ? 'Play Again' : 'Resume'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-600">
        Controls: Arrow keys to move/rotate, P to pause
      </div>
    </div>
  );
};

export default TetrisGame;
