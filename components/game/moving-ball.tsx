"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { Position } from "@/types/game"

type MovingBallProps = {
  color: string
  path: Position[]
  currentStep: number
}

export default function MovingBall({ color, path, currentStep }: MovingBallProps) {
  const ballRef = useRef<HTMLDivElement>(null)

  // Calculate the position of the ball based on the current step
  const currentPos = path[currentStep]
  const nextPos = path[Math.min(currentStep + 1, path.length - 1)]

  // Calculate the progress between current and next position (0 to 1)
  const progress = 0 // At the start of each step

  // Calculate the actual position on the grid
  const row = currentPos.row + (nextPos.row - currentPos.row) * progress
  const col = currentPos.col + (nextPos.col - currentPos.col) * progress

  // Add motion blur effect based on direction
  const isMovingHorizontally = currentPos.row === nextPos.row
  const isMovingVertically = currentPos.col === nextPos.col

  // Update the ball position
  useEffect(() => {
    if (!ballRef.current) return

    const cellSize = 100 / 9 // Percentage of the grid width/height

    // Position the ball using percentage of the grid
    ballRef.current.style.top = `calc(${row * cellSize}% + 0.125rem)`
    ballRef.current.style.left = `calc(${col * cellSize}% + 0.125rem)`
    ballRef.current.style.width = `calc(${cellSize}% - 0.25rem)`
    ballRef.current.style.height = `calc(${cellSize}% - 0.25rem)`
  }, [row, col])

  return (
    <div
      ref={ballRef}
      className={cn(
        "absolute rounded-full transition-all duration-10 z-10", // Changed duration from 50 to 10
        getBallColor(color),
        isMovingHorizontally && "motion-safe:blur-[2px]", // Increased blur for faster movement
        isMovingVertically && "motion-safe:blur-[2px]", // Increased blur for faster movement
      )}
      style={{
        transitionTimingFunction: "linear",
      }}
    />
  )
}

function getBallColor(color: string) {
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
