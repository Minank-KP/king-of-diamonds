const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store active game rooms
const rooms = {};

// Card values
const cardValues = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// Create a standard deck of cards
function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  
  return deck;
}

// Shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Initialize a new game
function initializeGame(roomId) {
  const deck = createDeck();
  // const shuffledDeck = shuffleArray([...deck]);
  
  // Deal 13 cards to each player from the entire deck
  const hands = {
    player1: deck.slice(0, 13),
    player2: deck.slice(13, 26)
  };
  
  // Use a single suit, shuffle the suit and then use it as the auction deck (it should be the  cards from 27 to 52)
  const auctionDeck = deck.slice(26).sort(() => Math.random() - 0.5);
  
  return {
    roomId,
    players: {},
    hands,
    auctionDeck,
    currentAuctionCard: null,
    round: 0,
    maxRounds: 13,
    bids: {},
    collections: {
      player1: [],
      player2: []
    },
    // Track all cards that have been in players' possession
    cardsHistory: {
      player1: [],
      player2: []
    },
    usedCards: {
      player1: [],
      player2: []
    },
    turnOrder: Math.random() < 0.5 ? ['player1', 'player2'] : ['player2', 'player1'],
    gameState: 'waiting' // waiting, bidding, revealing, gameOver
  };
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Create a new game room
  socket.on('createRoom', (playerName, callback) => {
    const roomId = uuidv4().substring(0, 6).toUpperCase();
    const game = initializeGame(roomId);
    
    // Assign player to the room
    game.players.player1 = {
      id: socket.id,
      name: playerName,
      role: 'player1'
    };
    
    socket.join(roomId);
    rooms[roomId] = game;
    
    callback({
      success: true,
      roomId,
      role: 'player1'
    });
    
    console.log(`Room ${roomId} created by ${playerName}`);
  });
  
  // Join an existing room
  socket.on('joinRoom', (data, callback) => {
    const { roomId, playerName } = data;
    
    if (!rooms[roomId]) {
      callback({ success: false, message: 'Room not found' });
      return;
    }
    
    const game = rooms[roomId];
    
    if (game.players.player2) {
      callback({ success: false, message: 'Room is full' });
      return;
    }
    
    // Assign player to the room
    game.players.player2 = {
      id: socket.id,
      name: playerName,
      role: 'player2'
    };
    
    socket.join(roomId);
    
    callback({
      success: true,
      roomId,
      role: 'player2'
    });
    
    // Start the game
    game.gameState = 'bidding';
    game.currentAuctionCard = game.auctionDeck[game.round];
    
    // Notify both players that the game has started
    io.to(roomId).emit('gameStarted', {
      players: {
        player1: game.players.player1.name,
        player2: game.players.player2.name
      },
      hands: {
        player1: game.hands.player1,
        player2: game.hands.player2
      },
      currentAuctionCard: game.currentAuctionCard,
      turnOrder: game.turnOrder
    });
    
    console.log(`${playerName} joined room ${roomId}`);
  });
  
  // Handle player bid
  socket.on('placeBid', (data) => {
    const { roomId, role, cardIndex } = data;
    const game = rooms[roomId];
    
    if (!game || game.gameState !== 'bidding') return;
    
    // Get the card from player's hand
    const card = game.hands[role][cardIndex];
    
    // Record the bid
    game.bids[role] = {
      card,
      index: cardIndex
    };
    
    // Add the card to used cards history
    game.usedCards[role].push(card);
    
    // Remove the card from player's hand
    game.hands[role].splice(cardIndex, 1);
    
    // Check if all players have bid
    if (Object.keys(game.bids).length === 2) {
      game.gameState = 'revealing';
      
      // Determine the winner
      const player1Bid = game.bids.player1.card;
      const player2Bid = game.bids.player2.card;
      
      let winner;
      if (cardValues[player1Bid.value] > cardValues[player2Bid.value]) {
        winner = 'player1';
      } else if (cardValues[player1Bid.value] < cardValues[player2Bid.value]) {
        winner = 'player2';
      } else {
        // In case of a tie, the player who is first in turn order wins
        winner = game.turnOrder[0];
      }
      
      // Add the auction card to the winner's collection
      game.collections[winner].push(game.currentAuctionCard);
      
      // Update the cards history for the winner
      game.cardsHistory[winner].push(game.currentAuctionCard);
      
      // Send the results to all players
      io.to(roomId).emit('bidResults', {
        bids: game.bids,
        winner,
        card: game.currentAuctionCard,
        cardsHistory: game.cardsHistory,
        usedCards: game.usedCards
      });
      
      // Reset bids for next round
      game.bids = {};
      
      // Move to next round
      game.round++;
      
      // Check if game is over
      if (game.round >= game.maxRounds) {
        // Calculate final scores
        const scores = {
          player1: game.collections.player1.reduce((sum, card) => sum + cardValues[card.value], 0),
          player2: game.collections.player2.reduce((sum, card) => sum + cardValues[card.value], 0)
        };
        
        game.gameState = 'gameOver';
        
        io.to(roomId).emit('gameOver', {
          collections: game.collections,
          scores,
          winner: scores.player1 > scores.player2 ? 'player1' : 
                 scores.player1 < scores.player2 ? 'player2' : 'tie'
        });
      } else {
        // Start next round after a delay
        setTimeout(() => {
          game.gameState = 'bidding';
          game.currentAuctionCard = game.auctionDeck[game.round];
          
          io.to(roomId).emit('newRound', {
            round: game.round + 1,
            currentAuctionCard: game.currentAuctionCard
          });
        }, 3000);
      }
    } else {
      // Notify the other player that a bid has been placed
      socket.to(roomId).emit('opponentBid');
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Find and clean up any rooms where this player was
    for (const roomId in rooms) {
      const game = rooms[roomId];
      
      if (game.players.player1 && game.players.player1.id === socket.id) {
        io.to(roomId).emit('playerDisconnected', { player: 'player1' });
        delete rooms[roomId];
        break;
      }
      
      if (game.players.player2 && game.players.player2.id === socket.id) {
        io.to(roomId).emit('playerDisconnected', { player: 'player2' });
        delete rooms[roomId];
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 