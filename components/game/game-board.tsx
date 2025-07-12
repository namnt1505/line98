"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import type { Cell, Position } from "@/types/game"
import BallComponent from "./ball"
import MovingBall from "./moving-ball"
import NextBallIndicator from "./next-ball-indicator"

type GameBoardProps = {
  grid: Cell[][]
  selectedCell: Position | null
  clickedBall: Position | null
  movingBall: {
    ball: { id: number; color: string }
    path: Position[]
    currentStep: number
  } | null
  nextBallPositions: Array<{ position: Position; color: string }>
  handleCellClick: (row: number, col: number) => void
}

export default function GameBoard({
  grid,
  selectedCell,
  clickedBall,
  movingBall,
  nextBallPositions,
  handleCellClick,
}: GameBoardProps) {
  // Memoize the next ball positions lookup for better performance
  const nextBallMap = useMemo(() => {
    const map = new Map<string, { position: Position; color: string }>()
    nextBallPositions.forEach((item) => {
      const key = `${item.position.row}-${item.position.col}`
      map.set(key, item)
    })
    return map
  }, [nextBallPositions])

  // Function to check if a position has a next ball indicator
  const getNextBallInfo = (row: number, col: number) => {
    return nextBallMap.get(`${row}-${col}`)
  }

  return (
    <div className="grid grid-cols-9 gap-1 bg-gray-200 p-1 rounded-lg relative">
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const nextBallInfo = getNextBallInfo(rowIndex, colIndex)
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
          const isClicked = clickedBall?.row === rowIndex && clickedBall?.col === colIndex

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                "w-full aspect-square bg-white rounded flex items-center justify-center cursor-pointer",
                isSelected && "bg-gray-100",
              )}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            >
              {cell.ball ? (
                <BallComponent
                  ball={cell.ball}
                  isSelected={isSelected}
                  isClicked={isClicked}
                />
              ) : nextBallInfo ? (
                <NextBallIndicator color={nextBallInfo.color} />
              ) : null}
            </div>
          )
        }),
      )}

      {/* Render the moving ball */}
      {movingBall && (
        <MovingBall color={movingBall.ball.color} path={movingBall.path} currentStep={movingBall.currentStep} />
      )}
    </div>
  )
}
