"use client"

import { useState, useEffect } from "react"
import type { Cell, Position } from "@/types/game"
import { useAudio } from "./use-audio"
import { useGrid } from "./use-grid"
import { useBalls } from "./use-balls"
import { useScoring } from "./use-scoring"
import { useGameHistory } from "./use-game-history"

// Constants
const MOVE_ANIMATION_SPEED = 10 // ms per cell for movement animation

export function useGameState() {
  const { playScoreSound, playMoveSound } = useAudio()
  const { grid, setGrid, initializeGrid, getEmptyCells, findPath } = useGrid()
  const {
    nextBalls,
    setNextBalls,
    nextBallPositions,
    setNextBallPositions,
    ballIdCounter,
    setBallIdCounter,
    movingBall,
    setMovingBall,
    generateRandomColors,
    generateNextBallPositions,
    startBallMovement,
    findNewRandomPosition,
  } = useBalls()
  const { score, setScore, removeLines } = useScoring(playScoreSound)
  const { gameHistory, setGameHistory, saveStateToHistory, canUndo } = useGameHistory()

  const [selectedCell, setSelectedCell] = useState<Position | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [clickedBall, setClickedBall] = useState<Position | null>(null)

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

  // Save game state to localStorage
  useEffect(() => {
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
      // IMPORTANT: Use the original ball's color, not any color from a next ball indicator
      const newGrid = [...grid.map((row) => [...row])]
      newGrid[finalPosition.row][finalPosition.col].ball = {
        id: movingBall.ball.id,
        color: movingBall.ball.color, // Preserve the original ball's color
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

    // Check if the current position has a next ball indicator
    const currentPosition = movingBall.path[movingBall.currentStep]
    const nextPosition = movingBall.path[Math.min(movingBall.currentStep + 1, movingBall.path.length - 1)]

    // Check if any next ball position is on the current or next step of the path
    const affectedNextBallIndex = nextBallPositions.findIndex(
      (item) =>
        (item.position.row === currentPosition.row && item.position.col === currentPosition.col) ||
        (item.position.row === nextPosition.row && item.position.col === nextPosition.col),
    )

    // If a next ball position is affected, move it to a new random position
    if (affectedNextBallIndex !== -1) {
      const newPosition = findNewRandomPosition(
        grid,
        getEmptyCells,
        movingBall.path, // Exclude the entire path
        nextBallPositions,
      )

      if (newPosition) {
        // Update the next ball positions
        const updatedNextBallPositions = [...nextBallPositions]
        updatedNextBallPositions[affectedNextBallIndex] = {
          ...updatedNextBallPositions[affectedNextBallIndex],
          position: newPosition,
        }

        setNextBallPositions(updatedNextBallPositions)
      }
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
  }, [movingBall, grid, nextBalls, nextBallPositions])

  const initializeGame = () => {
    // Create empty grid
    const newGrid = initializeGrid()

    setGrid(newGrid)
    setScore(0)
    setSelectedCell(null)
    setGameOver(false)
    setBallIdCounter(0)
    setGameHistory([])
    setMovingBall(null)

    // Generate initial next balls
    const initialNextBalls = generateRandomColors(3)
    setNextBalls(initialNextBalls)

    // Generate initial positions for next balls
    const initialPositions = generateNextBallPositions(newGrid, initialNextBalls, getEmptyCells)
    setNextBallPositions(initialPositions)

    // Add initial balls to the grid
    addNewBalls(newGrid, initialNextBalls)

    // Clear saved game
    localStorage.removeItem("line98GameState")
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
    const newNextBalls = generateRandomColors(3)

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
    const newPositions = generateNextBallPositions(newGrid, newNextBalls, getEmptyCells)
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
        startBallMovement(grid, selectedCell, path, setGrid)
        setSelectedCell(null)
      }
    } else if (cell.ball) {
      // Select the ball
      setSelectedCell({ row, col })
    }
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
    canUndo: canUndo(!!movingBall),
  }
}
