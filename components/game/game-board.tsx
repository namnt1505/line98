"use client"

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
  // Function to check if a position has a next ball indicator
  const getNextBallInfo = (row: number, col: number) => {
    return nextBallPositions.find((item) => item.position.row === row && item.position.col === col)
  }

  return (
    <div className="grid grid-cols-9 gap-1 bg-gray-200 p-1 rounded-lg relative">
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const nextBallInfo = getNextBallInfo(rowIndex, colIndex)

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                "w-full aspect-square bg-white rounded flex items-center justify-center cursor-pointer",
                selectedCell?.row === rowIndex && selectedCell?.col === colIndex && "bg-gray-100",
              )}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            >
              {cell.ball ? (
                <BallComponent
                  ball={cell.ball}
                  isSelected={selectedCell?.row === rowIndex && selectedCell?.col === colIndex}
                  isClicked={clickedBall?.row === rowIndex && clickedBall?.col === colIndex}
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
