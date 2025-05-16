"use client"
import BallComponent from "./ball"

type NextBallsPreviewProps = {
  nextBalls: string[]
}

export default function NextBallsPreview({ nextBalls }: NextBallsPreviewProps) {
  return (
    <div className="mb-4 flex justify-center gap-2">
      <div className="text-sm font-medium">Next balls:</div>
      {nextBalls.map((color, index) => (
        <div key={index} className="w-6 h-6">
          <BallComponent ball={{ id: index, color }} isSelected={false} isClicked={false} />
        </div>
      ))}
    </div>
  )
}
