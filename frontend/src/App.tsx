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
    socket.current?.close()
  }

  const winner = calculateWinner(squares)
  const isDraw = !winner && squares.every(square => square !== null)
  let status = ''
  let loser = null
  
  if (winner) {
    status = `勝者: ${winner}`
    loser = winner === '○' ? '×' : '○'
  } else if (isDraw) {
    status = '引き分け！'
  } else {
    status = `次のプレイヤー: ${xIsNext ? '○' : '×'}`
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
              <>
                <div className="animate-celebration-bounce flex items-center justify-center gap-2 text-[hsl(var(--winner-glow))]">
                  <Trophy className="w-6 h-6 animate-winner-glow" />
                  <span className="font-bold text-lg">
                    勝者: {winner}
                  </span>
                  <Trophy className="w-6 h-6 animate-winner-glow" />
                </div>
                <div className="animate-loser-shake mt-2 text-[hsl(var(--loser-fade))]">
                  残念！ {loser} の負け
                </div>
              </>
            ) : (
              <span className="font-semibold text-[hsl(var(--button-primary))]">{status}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {winner && <Confetti numberOfPieces={200} recycle={false} />}
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
                  ${winner && squares[i] === winner ? 'animate-winner-glow border-[hsl(var(--winner-glow))] bg-[hsl(var(--winner-glow))/5]' : ''}
                  ${winner && squares[i] === loser ? 'animate-loser-shake opacity-50 grayscale' : ''}`}
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
