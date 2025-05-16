"use client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import { useGameState } from "@/hooks/use-game-state"
import { useAudio } from "@/hooks/use-audio"
import GameBoard from "./game/game-board"
import GameControls from "./game/game-controls"
import NextBallsPreview from "./game/next-balls-preview"
import GameOverMessage from "./game/game-over-message"

export default function Line98Game() {
  const {
    grid,
    score,
    nextBalls,
    selectedCell,
    gameOver,
    clickedBall,
    movingBall,
    handleCellClick,
    initializeGame,
    handleUndo,
    canUndo,
  } = useGameState()

  const { isMuted, toggleMute } = useAudio()

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Score: {score}</span>
          <GameControls
            isMuted={isMuted}
            toggleMute={toggleMute}
            handleUndo={handleUndo}
            canUndo={canUndo}
            initializeGame={initializeGame}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <NextBallsPreview nextBalls={nextBalls} />

        <GameBoard
          grid={grid}
          selectedCell={selectedCell}
          clickedBall={clickedBall}
          movingBall={movingBall}
          handleCellClick={handleCellClick}
        />

        {gameOver && <GameOverMessage />}
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        <p>Connect 5 or more balls of the same color to score points. The game ends when the board is full.</p>
      </CardFooter>
    </Card>
  )
}
