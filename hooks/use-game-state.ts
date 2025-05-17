"use client"

import { useState, useEffect } from "react"
import type { Cell, Position, GameState } from "@/types/game"
import { useAudio } from "./use-audio"

// Constants
const COLORS = ["red", "blue", "green", "yellow", "purple"]
const GRID_SIZE = 9
const BALLS_PER_TURN = 3
const REQUIRED_LINE_LENGTH = 5
const MAX_HISTORY = 10 // Maximum number of states to keep in history
const MOVE_ANIMATION_SPEED = 50 // ms per cell for movement animation

export function useGameState() {
  const [grid, setGrid] = useState<Cell[][]>([])
  const [score, setScore] = useState(0)
  const [nextBalls, setNextBalls] = useState<string[]>([])
  const [nextBallPositions, setNextBallPositions] = useState<Array<{ position: Position; color: string }>>([])
  const [selectedCell, setSelectedCell] = useState<Position | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [ballIdCounter, setBallIdCounter] = useState(0)
  const [clickedBall, setClickedBall] = useState<Position | null>(null)
  const [gameHistory, setGameHistory] = useState<GameState[]>([])
  const [movingBall, setMovingBall] = useState<{
    ball: { id: number; color: string }
    path: Position[]
    currentStep: number
  } | null>(null)

  const { playScoreSound, playMoveSound } = useAudio()

  // Initialize the game
  useEffect(() => {
    // Try to load saved game from localStorage
    const savedGame = localStorage.getItem("line98GameState")

    if (savedGame) {
      try {
        const { grid, score, nextBalls, ballIdCounter, gameOver, nextBallPositions } = JSON.parse(savedGame)
        setGrid(grid)
        setScore(score)
        setNextBalls(nextBalls)
        setBallIdCounter(ballIdCounter)
        setGameOver(gameOver)
        if (nextBallPositions) {
          setNextBallPositions(nextBallPositions)
        }

        // Initialize history with the loaded state
        setGameHistory([{ grid, score, nextBalls, ballIdCounter, gameOver, nextBallPositions }])
      } catch (e) {
        // If there's an error parsing the saved game, initialize a new one
        initializeGame()
      }
    } else {
      initializeGame()
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
        nextBallPositions,
      }
      localStorage.setItem("line98GameState", JSON.stringify(gameState))
    }
  }, [grid, score, nextBalls, ballIdCounter, gameOver, nextBallPositions])

  // Animation effect for moving ball
  useEffect(() => {
    if (!movingBall) return

    // If we've reached the end of the path
    if (movingBall.currentStep >= movingBall.path.length - 1) {
      const finalPosition = movingBall.path[movingBall.path.length - 1]

      // Update the grid with the ball at its final position
      const newGrid = [...grid.map((row) => [...row])]
      newGrid[finalPosition.row][finalPosition.col].ball = {
        id: movingBall.ball.id,
        color: movingBall.ball.color,
      }

      setGrid(newGrid)
      setMovingBall(null)

      // Check for lines after the move is complete
      setTimeout(() => {
        const gridAfterMove = removeLines(newGrid)

        // If no lines were formed, add new balls
        if (JSON.stringify(gridAfterMove) === JSON.stringify(newGrid)) {
          addNewBalls(gridAfterMove, nextBalls)
        } else {
          setGrid(gridAfterMove)
        }
      }, 100)

      return
    }

    // Move to the next step in the path
    const timer = setTimeout(() => {
      setMovingBall((prev) => {
        if (!prev) return null
        return {
          ...prev,
          currentStep: prev.currentStep + 1,
        }
      })
    }, MOVE_ANIMATION_SPEED)

    return () => clearTimeout(timer)
  }, [movingBall, grid, nextBalls])

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
    setMovingBall(null)

    // Generate initial next balls
    const initialNextBalls = generateRandomColors(BALLS_PER_TURN)
    setNextBalls(initialNextBalls)

    // Generate initial positions for next balls
    const initialPositions = generateNextBallPositions(newGrid, initialNextBalls)
    setNextBallPositions(initialPositions)

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

  const generateNextBallPositions = (currentGrid: Cell[][], colors: string[]) => {
    const emptyCells = getEmptyCells(currentGrid)
    const positions: Array<{ position: Position; color: string }> = []

    // If there aren't enough empty cells, return empty array
    if (emptyCells.length < colors.length) {
      return positions
    }

    // Generate random positions for each color
    for (let i = 0; i < colors.length; i++) {
      if (emptyCells.length === 0) break

      const randomIndex = Math.floor(Math.random() * emptyCells.length)
      const position = emptyCells[randomIndex]

      positions.push({
        position,
        color: colors[i],
      })

      emptyCells.splice(randomIndex, 1)
    }

    return positions
  }

  const addNewBalls = (currentGrid: Cell[][], colors: string[]) => {
    // Save current state before adding new balls
    saveStateToHistory({
      grid: JSON.parse(JSON.stringify(currentGrid)),
      score,
      nextBalls,
      ballIdCounter,
      gameOver,
      nextBallPositions,
    })

    // Use the pre-generated positions if available
    const positions = nextBallPositions.length === colors.length ? nextBallPositions.map((item) => item.position) : []

    const emptyCells = getEmptyCells(currentGrid)

    if (emptyCells.length < colors.length) {
      setGameOver(true)
      return currentGrid
    }

    const newGrid = [...currentGrid.map((row) => [...row])]
    const newNextBalls = generateRandomColors(BALLS_PER_TURN)

    // Place new balls in the pre-generated positions or random positions
    for (let i = 0; i < colors.length; i++) {
      let position: Position

      if (positions.length > i) {
        // Use pre-generated position
        position = positions[i]
      } else {
        // Generate random position
        const randomIndex = Math.floor(Math.random() * emptyCells.length)
        position = emptyCells[randomIndex]
        emptyCells.splice(randomIndex, 1)
      }

      newGrid[position.row][position.col].ball = {
        id: ballIdCounter + i,
        color: colors[i],
        isNew: true,
      }
    }

    setBallIdCounter((prev) => prev + colors.length)
    setGrid(newGrid)
    setNextBalls(newNextBalls)

    // Generate positions for the next set of balls
    const newPositions = generateNextBallPositions(newGrid, newNextBalls)
    setNextBallPositions(newPositions)

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
    if (gameOver || movingBall) return

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
          nextBallPositions,
        })

        // Play move sound
        playMoveSound()

        // Start the ball movement animation
        animateBallMovement(selectedCell, path)
        setSelectedCell(null)
      }
    } else if (cell.ball) {
      // Select the ball
      setSelectedCell({ row, col })
    }
  }

  const animateBallMovement = (from: Position, path: Position[]) => {
    const ball = grid[from.row][from.col].ball
    if (!ball) return

    // Create a new grid without the ball at the starting position
    const newGrid = [...grid.map((row) => [...row])]
    newGrid[from.row][from.col].ball = null
    setGrid(newGrid)

    // Start the animation
    setMovingBall({
      ball: { id: ball.id, color: ball.color },
      path: [from, ...path],
      currentStep: 0,
    })
  }

  const saveStateToHistory = (state: GameState) => {
    setGameHistory((prev) => {
      // Limit history size
      const newHistory = [...prev, state].slice(-MAX_HISTORY)
      return newHistory
    })
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
      if (pointsScored > 0) {
        playScoreSound()
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

  const handleUndo = () => {
    if (gameHistory.length <= 1 || movingBall) return

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
    setMovingBall(null)
    if (previousState.nextBallPositions) {
      setNextBallPositions(previousState.nextBallPositions)
    }

    // Update history
    setGameHistory(newHistory)
  }

  return {
    grid,
    score,
    nextBalls,
    nextBallPositions,
    selectedCell,
    gameOver,
    clickedBall,
    movingBall,
    handleCellClick,
    initializeGame,
    handleUndo,
    canUndo: gameHistory.length > 1 && !movingBall,
  }
}
