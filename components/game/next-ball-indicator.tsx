"use client"

import { cn } from "@/lib/utils"

type NextBallIndicatorProps = {
  color: string
}

export default function NextBallIndicator({ color }: NextBallIndicatorProps) {
  return <div className={cn("w-3 h-3 rounded-full animate-pulse opacity-70", getIndicatorColor(color))} />
}

function getIndicatorColor(color: string) {
  switch (color) {
    case "red":
      return "bg-red-500"
    case "blue":
      return "bg-blue-500"
    case "green":
      return "bg-green-500"
    case "yellow":
      return "bg-yellow-500"
    case "purple":
      return "bg-purple-500"
    default:
      return "bg-gray-500"
  }
}
