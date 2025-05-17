"use client"

import { useState } from "react"
import type { Cell, Position } from "@/types/game"
import { GRID_SIZE } from "./use-grid"

// Constants
const REQUIRED_LINE_LENGTH = 5

export function useScoring(playScoreSound: () => void) {
  const [score, setScore] = useState(0)

  const removeLines = (currentGrid: Cell[][]): Cell[][] => {
    const newGrid = [...currentGrid.map((row) => [...row])]
    const ballsToRemove: Position[] = []

    // Check horizontal lines
    checkHorizontalLines(newGrid, ballsToRemove)

    // Check vertical lines
    checkVerticalLines(newGrid, ballsToRemove)

    // Check diagonal lines (top-left to bottom-right)
    checkDiagonalLinesTopLeftToBottomRight(newGrid, ballsToRemove)

    // Check diagonal lines (top-right to bottom-left)
    checkDiagonalLinesTopRightToBottomLeft(newGrid, ballsToRemove)

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

  const checkHorizontalLines = (grid: Cell[][], ballsToRemove: Position[]) => {
    for (let row = 0; row < GRID_SIZE; row++) {
      let currentColor = null
      let count = 0
      let lineStart = 0

      for (let col = 0; col < GRID_SIZE; col++) {
        const ball = grid[row][col].ball

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
  }

  const checkVerticalLines = (grid: Cell[][], ballsToRemove: Position[]) => {
    for (let col = 0; col < GRID_SIZE; col++) {
      let currentColor = null
      let count = 0
      let lineStart = 0

      for (let row = 0; row < GRID_SIZE; row++) {
        const ball = grid[row][col].ball

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
  }

  const checkDiagonalLinesTopLeftToBottomRight = (grid: Cell[][], ballsToRemove: Position[]) => {
    for (let startRow = 0; startRow <= GRID_SIZE - REQUIRED_LINE_LENGTH; startRow++) {
      for (let startCol = 0; startCol <= GRID_SIZE - REQUIRED_LINE_LENGTH; startCol++) {
        let currentColor = null
        let count = 0
        let positions: Position[] = []

        for (let i = 0; i < Math.min(GRID_SIZE - startRow, GRID_SIZE - startCol); i++) {
          const row = startRow + i
          const col = startCol + i
          const ball = grid[row][col].ball

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
  }

  const checkDiagonalLinesTopRightToBottomLeft = (grid: Cell[][], ballsToRemove: Position[]) => {
    for (let startRow = 0; startRow <= GRID_SIZE - REQUIRED_LINE_LENGTH; startRow++) {
      for (let startCol = REQUIRED_LINE_LENGTH - 1; startCol < GRID_SIZE; startCol++) {
        let currentColor = null
        let count = 0
        let positions: Position[] = []

        for (let i = 0; i < Math.min(GRID_SIZE - startRow, startCol + 1); i++) {
          const row = startRow + i
          const col = startCol - i
          const ball = grid[row][col].ball

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
  }

  return {
    score,
    setScore,
    removeLines,
  }
}
