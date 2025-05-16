import Line98Game from "@/components/line98-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-center">Line98 Game</h1>
      <Line98Game />
    </main>
  )
}
