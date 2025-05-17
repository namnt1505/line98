"use client"

import { useState } from "react"
import type { Cell, Position } from "@/types/game"

// Constants
export const GRID_SIZE = 9

export function useGrid() {
  const [grid, setGrid] = useState<Cell[][]>([])

  const initializeGrid = (): Cell[][] => {
    // Create empty grid
    return Array(GRID_SIZE)
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

  const findPath = (
    currentGrid: Cell[][],
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
  ): Position[] | null => {
    // If the destination has a ball, no path exists
    if (currentGrid[endRow][endCol].ball) return null

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
          !currentGrid[nextRow][nextCol].ball &&
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

  return {
    grid,
    setGrid,
    initializeGrid,
    getEmptyCells,
    findPath,
  }
}
