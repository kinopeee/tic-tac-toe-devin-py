from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional, Union
import uuid
import json
import logging

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Custom types for better type checking
from typing import TypedDict, Literal

class PlayerConnection(TypedDict):
    socket: WebSocket
    symbol: Literal["○", "×"]

class RoomState(TypedDict):
    squares: List[Optional[str]]
    xIsNext: bool
    winner: Optional[str]
    players: int

# In-memory storage for game rooms
rooms: Dict[str, RoomState] = {}
# Store WebSocket connections for each room
connections: Dict[str, List[PlayerConnection]] = {}

def generate_room_id() -> str:
    """Generate a short unique room ID."""
    return str(uuid.uuid4())[:8]

def calculate_winner(squares: List[Optional[str]]) -> Optional[str]:
    """Calculate winner of the game."""
    lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],  # rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8],  # columns
        [0, 4, 8], [2, 4, 6]  # diagonals
    ]
    for [a, b, c] in lines:
        if squares[a] and squares[a] == squares[b] == squares[c]:
            return squares[a]
    return None

@app.post("/create-room")
async def create_room():
    """Create a new game room."""
    room_id = generate_room_id()
    new_room: RoomState = {
        "squares": [None] * 9,
        "xIsNext": True,
        "winner": None,
        "players": 0
    }
    rooms[room_id] = new_room
    connections[room_id] = []
    logger.info(f"Created room: {room_id}")
    return {"room_id": room_id}

@app.post("/join-room/{room_id}")
async def join_room(room_id: str):
    """Join an existing game room."""
    if room_id not in rooms:
        raise HTTPException(status_code=404, detail="Room not found")
        
    current_players = len(connections.get(room_id, []))
    if current_players >= 2:
        raise HTTPException(status_code=403, detail="Room is full")
    
    # Assign player symbol based on join order
    player_symbol = "○" if current_players == 0 else "×"
    
    logger.info(f"Player joined room {room_id} as {player_symbol}. Current players: {current_players}")
    return {**rooms[room_id], "playerSymbol": player_symbol}

async def broadcast_state(room_id: str):
    """Broadcast game state to all connected clients in the room."""
    if room_id in connections:
        room_state = rooms[room_id]
        dead_connections: List[PlayerConnection] = []
        
        for connection in connections[room_id]:
            try:
                # Create player-specific message including their symbol
                player_state = {
                    **room_state,
                    "playerSymbol": connection["symbol"],
                    "isYourTurn": (room_state["xIsNext"] and connection["symbol"] == "×") or
                                 (not room_state["xIsNext"] and connection["symbol"] == "○"),
                    "isWinner": room_state["winner"] == connection["symbol"],
                    "isLoser": room_state["winner"] is not None and room_state["winner"] != connection["symbol"]
                }
                await connection["socket"].send_text(json.dumps(player_state))
                logger.debug(f"Broadcasted state to player {connection['symbol']} in room {room_id}")
            except Exception as e:
                logger.error(f"Failed to send to client: {str(e)}")
                dead_connections.append(connection)
        
        # Clean up dead connections
        for dead in dead_connections:
            connections[room_id].remove(dead)
            rooms[room_id]["players"] -= 1
            logger.info(f"Removed connection for player {dead['symbol']} from room {room_id}")

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    """Handle WebSocket connections for real-time game updates."""
    if room_id not in rooms:
        await websocket.close(code=4004)
        logger.warning(f"Rejected WebSocket connection - room {room_id} not found")
        return

    # Determine player symbol based on current connections
    current_players = len(connections.get(room_id, []))
    if current_players >= 2:
        await websocket.close(code=4003)
        logger.warning(f"Rejected WebSocket connection - room {room_id} is full")
        return

    player_symbol: Literal["○", "×"] = "○" if current_players == 0 else "×"
    
    await websocket.accept()
    if room_id not in connections:
        connections[room_id] = []
    
    # Store connection with player symbol
    player_connection: PlayerConnection = {
        "socket": websocket,
        "symbol": player_symbol
    }
    connections[room_id].append(player_connection)
    logger.info(f"WebSocket connection accepted for room {room_id} as {player_symbol}")

    try:
        # Send initial state with player symbol
        initial_state = {
            **rooms[room_id],
            "playerSymbol": player_symbol,
            "isYourTurn": (rooms[room_id]["xIsNext"] and player_symbol == "×") or
                         (not rooms[room_id]["xIsNext"] and player_symbol == "○")
        }
        await websocket.send_text(json.dumps(initial_state))
        
        while True:
            data = await websocket.receive_json()
            logger.debug(f"Received WebSocket message: {data}")
            
            if data["type"] == "move":
                index = data["index"]
                room = rooms[room_id]
                
                # Validate move
                if (0 <= index < 9 and 
                    not room["squares"][index] and 
                    not room["winner"]):
                    
                    # Update game state
                    room["squares"][index] = "○" if room["xIsNext"] else "×"
                    room["xIsNext"] = not room["xIsNext"]
                    room["winner"] = calculate_winner(room["squares"])
                    logger.info(f"Valid move made in room {room_id}")
                    
                    # Broadcast updated state
                    await broadcast_state(room_id)
                else:
                    logger.warning(f"Invalid move attempted in room {room_id}")

    except WebSocketDisconnect:
        if room_id in connections and websocket in connections[room_id]:
            connections[room_id].remove(websocket)
            rooms[room_id]["players"] -= 1
            logger.info(f"Client disconnected from room {room_id}")
            # Don't remove room immediately to allow reconnection
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        if room_id in connections and websocket in connections[room_id]:
            connections[room_id].remove(websocket)
            rooms[room_id]["players"] -= 1

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
