import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RotateCw, Trophy } from "lucide-react"
import { useSearchParams } from 'react-router-dom'
import Confetti from 'react-confetti'

const BACKEND_URL = 'https://app-hmpxhnsm.fly.dev'
const WS_URL = 'wss://app-hmpxhnsm.fly.dev'

function App() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [roomId, setRoomId] = useState<string | null>(searchParams.get('room'))
  const [joinRoomId, setJoinRoomId] = useState('')
  const [squares, setSquares] = useState<Array<string | null>>(Array(9).fill(null))
  const [xIsNext, setXIsNext] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localPlayerSymbol, setLocalPlayerSymbol] = useState<"○" | "×" | null>(null)
  const [isWinner, setIsWinner] = useState(false)
  const [isLoser, setIsLoser] = useState(false)
  const socket = useRef<WebSocket | null>(null)

  const calculateWinner = (squares: Array<string | null>): string | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ]

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a]
      }
    }
    return null
  }

  const createRoom = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/create-room`, {
        method: 'POST'
      })
      const data = await response.json()
      setRoomId(data.room_id)
      setSearchParams({ room: data.room_id })
    } catch (err) {
      setError('ルームの作成に失敗しました')
    }
  }

  const joinRoom = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/join-room/${joinRoomId}`, {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setRoomId(joinRoomId)
        setSearchParams({ room: joinRoomId })
        setSquares(data.squares)
        setXIsNext(data.xIsNext)
      } else {
        const error = await response.json()
        setError(error.detail)
      }
    } catch (err) {
      setError('ルームへの参加に失敗しました')
    }
  }

  const connectWebSocket = (roomId: string) => {
    socket.current = new WebSocket(`${WS_URL}/ws/${roomId}`)
    
    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setSquares(data.squares)
      setXIsNext(data.xIsNext)
      if (data.playerSymbol) {
        setLocalPlayerSymbol(data.playerSymbol)
      }
      if (data.winner) {
        setIsWinner(data.isWinner || false)
        setIsLoser(data.isLoser || false)
      } else {
        setIsWinner(false)
        setIsLoser(false)
      }
    }

    socket.current.onclose = () => {
      setError('再接続中...')
      // Try to reconnect after a short delay
      setTimeout(() => {
        if (roomId) {
          connectWebSocket(roomId)
        }
      }, 1000)
    }

    socket.current.onerror = () => {
      setError('接続エラーが発生しました')
    }
  }

  useEffect(() => {
    if (roomId) {
      connectWebSocket(roomId)
      return () => {
        socket.current?.close()
      }
    }
  }, [roomId])

  const handleClick = (i: number) => {
    if (!socket.current || squares[i] || calculateWinner(squares)) {
      return
    }
    const message = { type: 'move', index: i }
    socket.current.send(JSON.stringify(message))
  }

  const resetGame = () => {
    setRoomId(null)
    setSearchParams({})
    setSquares(Array(9).fill(null))
    setXIsNext(true)
    setIsWinner(false)
    setIsLoser(false)
    setLocalPlayerSymbol(null)
    socket.current?.close()
  }

  const winner = calculateWinner(squares)
  const isDraw = !winner && squares.every(square => square !== null)
  let status = ''
  
  if (winner) {
    if (isWinner) {
      status = `勝者: ${localPlayerSymbol}`
    } else if (isLoser) {
      status = `負けました...`
    } else {
      status = `勝者: ${winner}`
    }
  } else if (isDraw) {
    status = '引き分け！'
  } else {
    const currentPlayer = xIsNext ? '○' : '×'
    status = currentPlayer === localPlayerSymbol ? 
      'あなたの番です！' : 
      `${currentPlayer}の番です`
  }

  if (!roomId) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
        <Card className="w-[350px] shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--button-primary))] to-[hsl(var(--button-secondary))] bg-clip-text text-transparent">三目並べ</CardTitle>
            <CardDescription className="text-[hsl(var(--foreground))]">オンライン対戦</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Button 
                onClick={createRoom}
                className="w-full bg-[hsl(var(--button-primary))] hover:bg-[hsl(var(--button-primary))/90]"
              >
                新しいゲームを作成
              </Button>
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="ルームID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="border-[hsl(var(--button-secondary))] focus:ring-[hsl(var(--button-secondary))]"
              />
              <Button 
                onClick={joinRoom}
                className="w-full bg-[hsl(var(--button-secondary))] hover:bg-[hsl(var(--button-secondary))/90]"
                disabled={!joinRoomId}
              >
                ゲームに参加
              </Button>
            </div>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--background))] via-[hsl(var(--button-secondary))/5] to-[hsl(var(--button-primary))/5] flex flex-col items-center justify-center p-4">
      <Card className="w-[350px] shadow-lg backdrop-blur-sm bg-white/90">
        <CardHeader>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[hsl(var(--button-primary))] to-[hsl(var(--button-secondary))] bg-clip-text text-transparent">三目並べ</CardTitle>
          <CardDescription className="text-center">
            <span className="text-[hsl(var(--foreground))]">ルームID: {roomId}</span>
            <br />
            {winner ? (
              isWinner ? (
                <div className="animate-celebration-bounce flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-8 h-8 animate-winner-glow text-yellow-500" />
                    <span className="font-bold text-xl bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text text-transparent animate-text-shimmer">
                      勝者: {localPlayerSymbol}
                    </span>
                    <Trophy className="w-8 h-8 animate-winner-glow text-yellow-500" />
                  </div>
                  <div className="text-sm text-yellow-500 animate-pulse">
                    素晴らしい勝利！
                  </div>
                </div>
              ) : isLoser ? (
                <div className="animate-loser-shake flex flex-col items-center justify-center gap-2">
                  <div className="text-[hsl(var(--loser-fade))] opacity-50">
                    <span className="font-semibold text-xl blur-[0.5px]">負けました...</span>
                  </div>
                  <div className="text-sm text-[hsl(var(--loser-fade))] animate-pulse">
                    次は勝てるよ！
                  </div>
                  <div className="w-full h-full absolute inset-0 bg-gray-900/10 backdrop-blur-[1px] pointer-events-none"></div>
                </div>
              ) : (
                <span className="font-semibold text-[hsl(var(--button-primary))]">{status}</span>
              )
            ) : (
              <span className="font-semibold text-[hsl(var(--button-primary))]">{status}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isWinner && (
            <>
              <Confetti
                numberOfPieces={1000}
                recycle={false}
                colors={['#FFD700', '#FFA500', '#FF69B4', '#FF1493', '#00FF00', '#4169E1']}
                gravity={0.15}
                tweenDuration={8000}
                wind={0.02}
                width={window.innerWidth}
                height={window.innerHeight}
              />
              <Confetti
                numberOfPieces={300}
                recycle={true}
                colors={['#FFD700', '#FFA500']}
                gravity={0.1}
                tweenDuration={10000}
                wind={-0.02}
                width={window.innerWidth}
                height={window.innerHeight}
              />
            </>
          )}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {squares.map((value, i) => (
              <Button
                key={i}
                onClick={() => handleClick(i)}
                variant="outline"
                className={`w-20 h-20 text-3xl font-bold flex items-center justify-center transition-all
                  ${value === '○' ? 'text-[hsl(var(--player-o))] hover:bg-[hsl(var(--player-o))/5]' : ''}
                  ${value === '×' ? 'text-[hsl(var(--player-x))] hover:bg-[hsl(var(--player-x))/5]' : ''}
                  hover:border-[hsl(var(--button-primary))] hover:shadow-md hover:scale-105
                  disabled:opacity-80 disabled:hover:border-none disabled:hover:shadow-none disabled:hover:scale-100
                  ${isWinner && squares[i] === localPlayerSymbol ? 'animate-winner-glow border-[hsl(var(--winner-glow))] bg-[hsl(var(--winner-glow))/5]' : ''}
                  ${isLoser && squares[i] === localPlayerSymbol ? 'animate-loser-shake opacity-50 grayscale' : ''}`}
                disabled={!!value || !!winner}
              >
                {value}
              </Button>
            ))}
          </div>
          <Button
            onClick={resetGame}
            variant="outline"
            className="w-full flex items-center gap-2 border-[hsl(var(--button-secondary))] hover:bg-[hsl(var(--button-secondary))/10] transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            新しいゲーム
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
