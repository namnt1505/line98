"use client"

import { useState } from "react"
import type { Cell, Position } from "@/types/game"

// Constants
const COLORS = ["red", "blue", "green", "yellow", "purple"]
const BALLS_PER_TURN = 3

export function useBalls() {
  const [nextBalls, setNextBalls] = useState<string[]>([])
  const [nextBallPositions, setNextBallPositions] = useState<Array<{ position: Position; color: string }>>([])
  const [ballIdCounter, setBallIdCounter] = useState(0)
  const [movingBall, setMovingBall] = useState<{
    ball: { id: number; color: string }
    path: Position[]
    currentStep: number
  } | null>(null)

  const generateRandomColors = (count: number): string[] => {
    return Array(count)
      .fill(null)
      .map(() => COLORS[Math.floor(Math.random() * COLORS.length)])
  }

  const generateNextBallPositions = (
    currentGrid: Cell[][],
    colors: string[],
    getEmptyCells: (grid: Cell[][]) => Position[],
  ) => {
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

  const startBallMovement = (grid: Cell[][], from: Position, path: Position[], setGrid: (grid: Cell[][]) => void) => {
    const ball = grid[from.row][from.col].ball
    if (!ball) return

    // Create a new grid without the ball at the starting position
    const newGrid = [...grid.map((row) => [...row])]
    newGrid[from.row][from.col].ball = null
    setGrid(newGrid)

    // Start the animation - make sure to preserve the original ball's color
    setMovingBall({
      ball: {
        id: ball.id,
        color: ball.color, // Ensure we're using the original ball's color
      },
      path: [from, ...path],
      currentStep: 0,
    })
  }

  // Add a utility function to find a new random position for a next ball
  const findNewRandomPosition = (
    grid: Cell[][],
    getEmptyCells: (grid: Cell[][]) => Position[],
    excludePositions: Position[],
    currentNextBallPositions: Array<{ position: Position; color: string }>,
  ): Position | null => {
    // Get all empty cells
    const emptyCells = getEmptyCells(grid).filter(
      (cell) =>
        // Filter out excluded positions (like the ball's path)
        !excludePositions.some((pos) => pos.row === cell.row && pos.col === cell.col) &&
        // Filter out cells that are already marked as next ball positions
        !currentNextBallPositions.some(
          (nextBall) => nextBall.position.row === cell.row && nextBall.position.col === cell.col,
        ),
    )

    if (emptyCells.length === 0) return null

    // Choose a random new position
    const randomIndex = Math.floor(Math.random() * emptyCells.length)
    return emptyCells[randomIndex]
  }

  return {
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
  }
}
