"use client"

import { Button } from "@/components/ui/button"
import { Undo2, Volume2, VolumeX } from "lucide-react"

type GameControlsProps = {
  isMuted: boolean
  toggleMute: () => void
  handleUndo: () => void
  canUndo: boolean
  initializeGame: () => void
}

export default function GameControls({ isMuted, toggleMute, handleUndo, canUndo, initializeGame }: GameControlsProps) {
  return (
    <div className="flex gap-2">
      <Button onClick={toggleMute} variant="outline" size="sm" title={isMuted ? "Unmute" : "Mute"} className="px-2">
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>
      <Button onClick={handleUndo} variant="outline" size="sm" disabled={!canUndo} title="Undo last move">
        <Undo2 className="h-4 w-4 mr-1" />
        Undo
      </Button>
      <Button onClick={initializeGame} variant="outline" size="sm">
        New Game
      </Button>
    </div>
  )
}
