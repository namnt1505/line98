"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"
import type { Ball } from "@/types/game"

type BallProps = {
  ball: Ball
  isSelected: boolean
  isClicked: boolean
}

const BallComponent = memo(function BallComponent({ ball, isSelected, isClicked }: BallProps) {
  return (
    <div
      className={cn(
        "w-4/5 h-4/5 rounded-full transition-all duration-300",
        getBallColor(ball.color),
        ball.isNew && "animate-pulse",
        ball.isMoving && "scale-90 opacity-90",
        isSelected && "animate-[bounce_0.5s_ease-in-out_infinite]",
        isClicked && "scale-110 transition-transform duration-200",
      )}
    />
  )
})

export default BallComponent

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
