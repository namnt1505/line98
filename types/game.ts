export type Ball = {
  id: number
  color: string
  isNew?: boolean
  isMoving?: boolean
}

export type Cell = {
  ball: Ball | null
  row: number
  col: number
}

export type Position = {
  row: number
  col: number
}

export type GameState = {
  grid: Cell[][]
  score: number
  nextBalls: string[]
  ballIdCounter: number
  gameOver: boolean
  nextBallPositions: Array<{ position: Position; color: string }>
}
