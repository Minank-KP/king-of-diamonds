import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';

// Components
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';

// Define types
interface Player {
  id: string;
  name: string;
  role: string;
}

interface Card {
  suit: string;
  value: string;
}

interface GameState {
  roomId: string | null;
  playerName: string;
  playerRole: string | null;
  connected: boolean;
  gameStarted: boolean;
  currentAuctionCard: Card | null;
  hand: Card[];
  opponentHandCount: number;
  round: number;
  maxRounds: number;
  bids: Record<string, { card: Card, index: number }>;
  collections: Record<string, Card[]>;
  winner: string | null;
  scores: Record<string, number> | null;
  gameOver: boolean;
  message: string;
  opponentName: string | null;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    roomId: null,
    playerName: '',
    playerRole: null,
    connected: false,
    gameStarted: false,
    currentAuctionCard: null,
    hand: [],
    opponentHandCount: 13,
    round: 0,
    maxRounds: 13,
    bids: {},
    collections: { player1: [], player2: [] },
    winner: null,
    scores: null,
    gameOver: false,
    message: '',
    opponentName: null
  });

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      setGameState(prev => ({ ...prev, connected: true }));
    });

    newSocket.on('disconnect', () => {
      setGameState(prev => ({ ...prev, connected: false }));
    });

    newSocket.on('gameStarted', (data) => {
      console.log('gameStarted', data);
      setGameState(prev => {
        const playerHand = prev.playerRole === 'player1' ? 
          data.hands?.player1 || [] : 
          data.hands?.player2 || [];
          
        return {
          ...prev,
          gameStarted: true,
          currentAuctionCard: data.currentAuctionCard,
          hand: playerHand,
          opponentName: prev.playerRole === 'player1' ? data.players.player2 : data.players.player1,
          message: 'Game started! Place your bid.'
        };
      });
    });

    newSocket.on('newRound', (data) => {
      setGameState(prev => ({
        ...prev,
        round: data.round - 1,
        currentAuctionCard: data.currentAuctionCard,
        bids: {},
        message: `Round ${data.round}: Place your bid.`
      }));
    });

    newSocket.on('opponentBid', () => {
      setGameState(prev => ({
        ...prev,
        opponentHandCount: prev.opponentHandCount - 1,
        message: 'Opponent has placed a bid. Waiting for you...'
      }));
    });

    newSocket.on('bidResults', (data) => {
      const isWinner = data.winner === gameState.playerRole;
      
      setGameState(prev => ({
        ...prev,
        bids: data.bids,
        collections: {
          ...prev.collections,
          [data.winner]: [...prev.collections[data.winner], data.card]
        },
        message: isWinner ? 'You won this round!' : 'You lost this round.',
      }));
    });

    newSocket.on('gameOver', (data) => {
      const isWinner = data.winner === gameState.playerRole;
      const isTie = data.winner === 'tie';
      
      setGameState(prev => ({
        ...prev,
        collections: data.collections,
        scores: data.scores,
        winner: data.winner,
        gameOver: true,
        message: isTie ? 'Game over! It\'s a tie!' : isWinner ? 'Game over! You won!' : 'Game over! You lost.'
      }));
    });

    // Cleanup on component unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleCreateRoom = (playerName: string) => {
    if (socket && playerName.trim()) {
      socket.emit('createRoom', playerName, (response: any) => {
        if (response.success) {
          setGameState(prev => ({
            ...prev,
            roomId: response.roomId,
            playerName,
            playerRole: response.role,
            message: `Room created! Share code: ${response.roomId}`
          }));
        }
      });
    }
  };

  const handleJoinRoom = (roomId: string, playerName: string) => {
    if (socket && roomId.trim() && playerName.trim()) {
      socket.emit('joinRoom', { roomId, playerName }, (response: any) => {
        if (response.success) {
          setGameState(prev => ({
            ...prev,
            roomId: response.roomId,
            playerName,
            playerRole: response.role,
            message: 'Joined room! Game starting...'
          }));
        } else {
          setGameState(prev => ({
            ...prev,
            message: response.message
          }));
        }
      });
    }
  };

  const handlePlaceBid = (cardIndex: number) => {
    if (socket && gameState.roomId && gameState.playerRole) {
      socket.emit('placeBid', {
        roomId: gameState.roomId,
        role: gameState.playerRole,
        cardIndex
      });
      
      // Update local state
      const card = gameState.hand[cardIndex];
      const newHand = [...gameState.hand];
      newHand.splice(cardIndex, 1);
      
      setGameState(prev => ({
        ...prev,
        hand: newHand,
        bids: {
          ...prev.bids,
          [prev.playerRole!]: { card, index: cardIndex }
        },
        message: 'Bid placed! Waiting for opponent...'
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      {!gameState.gameStarted ? (
        <Lobby
          playerName={gameState.playerName}
          roomId={gameState.roomId}
          message={gameState.message}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      ) : (
        <GameBoard
          gameState={gameState}
          onPlaceBid={handlePlaceBid}
        />
      )}
    </div>
  );
}

export default App;
