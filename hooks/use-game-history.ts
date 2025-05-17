"use client"

import { useState } from "react"
import type { GameState } from "@/types/game"

// Constants
const MAX_HISTORY = 10 // Maximum number of states to keep in history

export function useGameHistory() {
  const [gameHistory, setGameHistory] = useState<GameState[]>([])

  const saveStateToHistory = (state: GameState) => {
    setGameHistory((prev) => {
      // Limit history size
      const newHistory = [...prev, state].slice(-MAX_HISTORY)
      return newHistory
    })
  }

  const canUndo = (isMovingBall: boolean) => {
    return gameHistory.length > 1 && !isMovingBall
  }

  return {
    gameHistory,
    setGameHistory,
    saveStateToHistory,
    canUndo,
  }
}
