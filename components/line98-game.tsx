"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Undo2 } from "lucide-react"

// Ball colors
const COLORS = ["red", "blue", "green", "yellow", "purple"]
const GRID_SIZE = 9
const BALLS_PER_TURN = 3
const REQUIRED_LINE_LENGTH = 5
const MAX_HISTORY = 10 // Maximum number of states to keep in history

type Ball = {
  id: number
  color: string
  isNew?: boolean
  isMoving?: boolean
}

type Cell = {
  ball: Ball | null
  row: number
  col: number
}

type Position = {
  row: number
  col: number
}

type GameState = {
  grid: Cell[][]
  score: number
  nextBalls: string[]
  ballIdCounter: number
  gameOver: boolean
}

export default function Line98Game() {
  const [grid, setGrid] = useState<Cell[][]>([])
  const [score, setScore] = useState(0)
  const [nextBalls, setNextBalls] = useState<string[]>([])
  const [selectedCell, setSelectedCell] = useState<Position | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [ballIdCounter, setBallIdCounter] = useState(0)
  const [clickedBall, setClickedBall] = useState<Position | null>(null)
  const [gameHistory, setGameHistory] = useState<GameState[]>([])
  const scoreAudioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize the game
  useEffect(() => {
    // Create audio element for score sound
    scoreAudioRef.current = new Audio("/score-sound.mp3")

    // Try to load saved game from localStorage
    const savedGame = localStorage.getItem("line98GameState")
    if (savedGame) {
      try {
        const { grid, score, nextBalls, ballIdCounter, gameOver } = JSON.parse(savedGame)
        setGrid(grid)
        setScore(score)
        setNextBalls(nextBalls)
        setBallIdCounter(ballIdCounter)
        setGameOver(gameOver)

        // Initialize history with the loaded state
        setGameHistory([{ grid, score, nextBalls, ballIdCounter, gameOver }])
      } catch (e) {
        // If there's an error parsing the saved game, initialize a new one
        initializeGame()
      }
    } else {
      initializeGame()
    }

    return () => {
      // Cleanup audio
      if (scoreAudioRef.current) {
        scoreAudioRef.current.pause()
        scoreAudioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // Save game state to localStorage whenever it changes
    if (grid.length > 0) {
      const gameState = {
        grid,
        score,
        nextBalls,
        ballIdCounter,
        gameOver,
      }
      localStorage.setItem("line98GameState", JSON.stringify(gameState))
    }
  }, [grid, score, nextBalls, ballIdCounter, gameOver])

  // Save state to history when making a move
  const saveStateToHistory = (state: GameState) => {
    setGameHistory((prev) => {
      // Limit history size
      const newHistory = [...prev, state].slice(-MAX_HISTORY)
      return newHistory
    })
  }

  const initializeGame = () => {
    // Create empty grid
    const newGrid: Cell[][] = Array(GRID_SIZE)
      .fill(null)
      .map((_, row) =>
        Array(GRID_SIZE)
          .fill(null)
          .map((_, col) => ({
            ball: null,
            row,
            col,
          })),
      )

    setGrid(newGrid)
    setScore(0)
    setSelectedCell(null)
    setGameOver(false)
    setBallIdCounter(0)
    setGameHistory([])

    // Generate initial next balls
    const initialNextBalls = generateRandomColors(BALLS_PER_TURN)
    setNextBalls(initialNextBalls)

    // Add initial balls to the grid
    addNewBalls(newGrid, initialNextBalls)

    // Clear saved game
    localStorage.removeItem("line98GameState")
  }

  const generateRandomColors = (count: number): string[] => {
    return Array(count)
      .fill(null)
      .map(() => COLORS[Math.floor(Math.random() * COLORS.length)])
  }

  const addNewBalls = (currentGrid: Cell[][], colors: string[]) => {
    // Save current state before adding new balls
    saveStateToHistory({
      grid: JSON.parse(JSON.stringify(currentGrid)),
      score,
      nextBalls,
      ballIdCounter,
      gameOver,
    })

    const emptyCells = getEmptyCells(currentGrid)

    if (emptyCells.length < colors.length) {
      setGameOver(true)
      return currentGrid
    }

    const newGrid = [...currentGrid.map((row) => [...row])]
    const newNextBalls = generateRandomColors(BALLS_PER_TURN)

    // Place new balls in random empty cells
    for (let i = 0; i < colors.length; i++) {
      if (emptyCells.length === 0) break

      const randomIndex = Math.floor(Math.random() * emptyCells.length)
      const { row, col } = emptyCells[randomIndex]

      newGrid[row][col].ball = {
        id: ballIdCounter + i,
        color: colors[i],
        isNew: true,
      }

      emptyCells.splice(randomIndex, 1)
    }

    setBallIdCounter((prev) => prev + colors.length)
    setGrid(newGrid)
    setNextBalls(newNextBalls)

    // Check for lines after adding new balls
    setTimeout(() => {
      const updatedGrid = removeLines(newGrid)
      setGrid(
        updatedGrid.map((row) =>
          row.map((cell) => ({
            ...cell,
            ball: cell.ball ? { ...cell.ball, isNew: false } : null,
          })),
        ),
      )
    }, 300)

    return newGrid
  }

  const getEmptyCells = (currentGrid: Cell[][]): Position[] => {
    const emptyCells: Position[] = []

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!currentGrid[row][col].ball) {
          emptyCells.push({ row, col })
        }
      }
    }

    return emptyCells
  }

  const handleCellClick = (row: number, col: number) => {
    if (gameOver) return

    const cell = grid[row][col]

    // Add click effect
    if (cell.ball) {
      setClickedBall({ row, col })
      setTimeout(() => setClickedBall(null), 300)
    }

    // If a ball is already selected
    if (selectedCell) {
      // If clicking on the same ball, deselect it
      if (selectedCell.row === row && selectedCell.col === col) {
        setSelectedCell(null)
        return
      }

      // If clicking on another ball, select that one instead
      if (cell.ball) {
        setSelectedCell({ row, col })
        return
      }

      // If clicking on an empty cell, try to move the selected ball
      const path = findPath(grid, selectedCell.row, selectedCell.col, row, col)

      if (path) {
        // Save current state before moving
        saveStateToHistory({
          grid: JSON.parse(JSON.stringify(grid)),
          score,
          nextBalls,
          ballIdCounter,
          gameOver,
        })

        moveBall(selectedCell, { row, col })
        setSelectedCell(null)
      }
    } else if (cell.ball) {
      // Select the ball
      setSelectedCell({ row, col })
    }
  }

  const moveBall = (from: Position, to: Position) => {
    const newGrid = [...grid.map((row) => [...row])]
    const ball = newGrid[from.row][from.col].ball

    if (!ball) return

    // Create a temporary ball for animation
    const tempBall = { ...ball, isMoving: true }
    newGrid[from.row][from.col].ball = null

    // Set a temporary ball in the target position for animation
    newGrid[to.row][to.col].ball = tempBall

    setGrid(newGrid)

    // After animation completes, finalize the move
    setTimeout(() => {
      const updatedGrid = [...newGrid.map((row) => [...row])]
      updatedGrid[to.row][to.col].ball = { ...ball, isMoving: false }

      setGrid(updatedGrid)

      // Check for lines
      setTimeout(() => {
        const gridAfterMove = removeLines(updatedGrid)

        // If no lines were formed, add new balls
        if (JSON.stringify(gridAfterMove) === JSON.stringify(updatedGrid)) {
          addNewBalls(gridAfterMove, nextBalls)
        } else {
          setGrid(gridAfterMove)
        }
      }, 300)
    }, 300) // Match this with the CSS transition duration
  }

  const removeLines = (currentGrid: Cell[][]): Cell[][] => {
    const newGrid = [...currentGrid.map((row) => [...row])]
    const ballsToRemove: Position[] = []

    // Check horizontal lines
    for (let row = 0; row < GRID_SIZE; row++) {
      let currentColor = null
      let count = 0
      let lineStart = 0

      for (let col = 0; col < GRID_SIZE; col++) {
        const ball = newGrid[row][col].ball

        if (ball && ball.color === currentColor) {
          count++
        } else {
          if (count >= REQUIRED_LINE_LENGTH) {
            for (let i = lineStart; i < col; i++) {
              ballsToRemove.push({ row, col: i })
            }
          }

          currentColor = ball ? ball.color : null
          count = ball ? 1 : 0
          lineStart = col
        }
      }

      if (count >= REQUIRED_LINE_LENGTH) {
        for (let i = lineStart; i < GRID_SIZE; i++) {
          ballsToRemove.push({ row, col: i })
        }
      }
    }

    // Check vertical lines
    for (let col = 0; col < GRID_SIZE; col++) {
      let currentColor = null
      let count = 0
      let lineStart = 0

      for (let row = 0; row < GRID_SIZE; row++) {
        const ball = newGrid[row][col].ball

        if (ball && ball.color === currentColor) {
          count++
        } else {
          if (count >= REQUIRED_LINE_LENGTH) {
            for (let i = lineStart; i < row; i++) {
              ballsToRemove.push({ row: i, col })
            }
          }

          currentColor = ball ? ball.color : null
          count = ball ? 1 : 0
          lineStart = row
        }
      }

      if (count >= REQUIRED_LINE_LENGTH) {
        for (let i = lineStart; i < GRID_SIZE; i++) {
          ballsToRemove.push({ row: i, col })
        }
      }
    }

    // Check diagonal lines (top-left to bottom-right)
    for (let startRow = 0; startRow <= GRID_SIZE - REQUIRED_LINE_LENGTH; startRow++) {
      for (let startCol = 0; startCol <= GRID_SIZE - REQUIRED_LINE_LENGTH; startCol++) {
        let currentColor = null
        let count = 0
        let positions: Position[] = []

        for (let i = 0; i < Math.min(GRID_SIZE - startRow, GRID_SIZE - startCol); i++) {
          const row = startRow + i
          const col = startCol + i
          const ball = newGrid[row][col].ball

          if (ball && ball.color === currentColor) {
            count++
            positions.push({ row, col })
          } else {
            if (count >= REQUIRED_LINE_LENGTH) {
              ballsToRemove.push(...positions)
            }

            currentColor = ball ? ball.color : null
            count = ball ? 1 : 0
            positions = ball ? [{ row, col }] : []
          }
        }

        if (count >= REQUIRED_LINE_LENGTH) {
          ballsToRemove.push(...positions)
        }
      }
    }

    // Check diagonal lines (top-right to bottom-left)
    for (let startRow = 0; startRow <= GRID_SIZE - REQUIRED_LINE_LENGTH; startRow++) {
      for (let startCol = REQUIRED_LINE_LENGTH - 1; startCol < GRID_SIZE; startCol++) {
        let currentColor = null
        let count = 0
        let positions: Position[] = []

        for (let i = 0; i < Math.min(GRID_SIZE - startRow, startCol + 1); i++) {
          const row = startRow + i
          const col = startCol - i
          const ball = newGrid[row][col].ball

          if (ball && ball.color === currentColor) {
            count++
            positions.push({ row, col })
          } else {
            if (count >= REQUIRED_LINE_LENGTH) {
              ballsToRemove.push(...positions)
            }

            currentColor = ball ? ball.color : null
            count = ball ? 1 : 0
            positions = ball ? [{ row, col }] : []
          }
        }

        if (count >= REQUIRED_LINE_LENGTH) {
          ballsToRemove.push(...positions)
        }
      }
    }

    // Remove balls and update score
    if (ballsToRemove.length > 0) {
      const uniquePositions = new Set<string>()

      for (const { row, col } of ballsToRemove) {
        const key = `${row},${col}`
        if (!uniquePositions.has(key) && newGrid[row][col].ball) {
          uniquePositions.add(key)
          newGrid[row][col].ball = null
        }
      }

      const pointsScored = uniquePositions.size
      setScore((prev) => prev + pointsScored)

      // Play score sound
      if (pointsScored > 0 && scoreAudioRef.current) {
        scoreAudioRef.current.currentTime = 0
        scoreAudioRef.current.play().catch((e) => {
          // Handle autoplay restrictions
          console.log("Audio playback failed:", e)
        })
      }
    }

    return newGrid
  }

  const findPath = (
    grid: Cell[][],
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
  ): Position[] | null => {
    // If the destination has a ball, no path exists
    if (grid[endRow][endCol].ball) return null

    const queue: { pos: Position; path: Position[] }[] = [{ pos: { row: startRow, col: startCol }, path: [] }]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { pos, path } = queue.shift()!
      const { row, col } = pos

      // If we've reached the destination, return the path
      if (row === endRow && col === endCol) {
        return [...path, { row, col }]
      }

      const key = `${row},${col}`
      if (visited.has(key)) continue
      visited.add(key)

      // Try all four directions
      const directions = [
        { row: row - 1, col }, // up
        { row: row + 1, col }, // down
        { row, col: col - 1 }, // left
        { row, col: col + 1 }, // right
      ]

      for (const nextPos of directions) {
        const { row: nextRow, col: nextCol } = nextPos

        // Check if the position is valid and not visited
        if (
          nextRow >= 0 &&
          nextRow < GRID_SIZE &&
          nextCol >= 0 &&
          nextCol < GRID_SIZE &&
          !grid[nextRow][nextCol].ball &&
          !visited.has(`${nextRow},${nextCol}`)
        ) {
          queue.push({
            pos: nextPos,
            path: [...path, { row, col }],
          })
        }
      }
    }

    // No path found
    return null
  }

  const getBallColor = (color: string) => {
    switch (color) {
      case "red":
        return "bg-gradient-to-br from-red-400 to-red-600 shadow-[inset_0_-3px_4px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)]"
      case "blue":
        return "bg-gradient-to-br from-blue-400 to-blue-600 shadow-[inset_0_-3px_4px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)]"
      case "green":
        return "bg-gradient-to-br from-green-400 to-green-600 shadow-[inset_0_-3px_4px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)]"
      case "yellow":
        return "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[inset_0_-3px_4px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)]"
      case "purple":
        return "bg-gradient-to-br from-purple-400 to-purple-600 shadow-[inset_0_-3px_4px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)]"
      default:
        return "bg-gradient-to-br from-gray-400 to-gray-600 shadow-[inset_0_-3px_4px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)]"
    }
  }

  const handleUndo = () => {
    if (gameHistory.length <= 1) return

    // Remove the current state and go back to the previous one
    const newHistory = [...gameHistory]
    newHistory.pop() // Remove current state
    const previousState = newHistory[newHistory.length - 1]

    // Restore previous state
    setGrid(previousState.grid)
    setScore(previousState.score)
    setNextBalls(previousState.nextBalls)
    setBallIdCounter(previousState.ballIdCounter)
    setGameOver(previousState.gameOver)
    setSelectedCell(null)

    // Update history
    setGameHistory(newHistory)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Score: {score}</span>
          <div className="flex gap-2">
            <Button
              onClick={handleUndo}
              variant="outline"
              size="sm"
              disabled={gameHistory.length <= 1}
              title="Undo last move"
            >
              <Undo2 className="h-4 w-4 mr-1" />
              Undo
            </Button>
            <Button onClick={initializeGame} variant="outline" size="sm">
              New Game
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-center gap-2">
          <div className="text-sm font-medium">Next balls:</div>
          {nextBalls.map((color, index) => (
            <div key={index} className={cn("w-6 h-6 rounded-full", getBallColor(color))} />
          ))}
        </div>

        <div className="grid grid-cols-9 gap-1 bg-gray-200 p-1 rounded-lg">
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                  "w-full aspect-square bg-white rounded flex items-center justify-center cursor-pointer",
                  selectedCell?.row === rowIndex && selectedCell?.col === colIndex && "bg-gray-100",
                )}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell.ball && (
                  <div
                    className={cn(
                      "w-4/5 h-4/5 rounded-full transition-all duration-300",
                      getBallColor(cell.ball.color),
                      cell.ball.isNew && "animate-pulse",
                      cell.ball.isMoving && "scale-90 opacity-90",
                      selectedCell?.row === rowIndex && selectedCell?.col === colIndex && "ring-2 ring-black",
                      clickedBall?.row === rowIndex &&
                        clickedBall?.col === colIndex &&
                        "scale-110 transition-transform duration-200",
                    )}
                  />
                )}
              </div>
            )),
          )}
        </div>

        {gameOver && <div className="mt-4 text-center font-bold text-red-500">Game Over! No more moves available.</div>}
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        <p>Connect 5 or more balls of the same color to score points. The game ends when the board is full.</p>
      </CardFooter>

      {/* Hidden audio element for score sound */}
      <audio src="/score-sound.mp3" preload="auto" ref={scoreAudioRef} />
    </Card>
  )
}
