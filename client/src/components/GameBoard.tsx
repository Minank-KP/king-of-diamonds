import { useEffect, useState } from 'react';
import Card from './Card';

// Updated Card interface to match the API response
interface Card {
  suit: string;
  value: string;
  image?: string;
  code?: string;
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
  deckId?: string;
  bidsRevealed?: boolean;
}

interface GameBoardProps {
  gameState: GameState;
  onPlaceBid: (cardIndex: number) => void;
}

const GameBoard = ({ gameState, onPlaceBid }: GameBoardProps) => {
  const [cardBackImage, setCardBackImage] = useState<string>("https://deckofcardsapi.com/static/img/back.png");
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  
  const {
    playerRole,
    currentAuctionCard,
    hand,
    opponentHandCount,
    round,
    maxRounds,
    bids,
    collections,
    winner,
    scores,
    gameOver,
    message,
    opponentName,
    bidsRevealed = false
  } = gameState;

  const playerCollection = playerRole ? collections[playerRole] : [];
  const opponentCollection = playerRole === 'player1' ? collections.player2 : collections.player1;
  
  const playerBid = playerRole && bids[playerRole] ? bids[playerRole].card : null;
  const opponentBid = playerRole === 'player1' && bids.player2 ? bids.player2.card : 
                      playerRole === 'player2' && bids.player1 ? bids.player1.card : null;
  
  const opponentHasBid = playerRole === 'player1' ? !!bids.player2 : !!bids.player1;

  const calculateScore = (cards: Card[]) => {
    const cardValues: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
      'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    
    return cards.reduce((sum, card) => {
      // Handle API value format (e.g., "KING" instead of "K")
      const value = card.value === 'KING' ? 'K' : 
                    card.value === 'QUEEN' ? 'Q' : 
                    card.value === 'JACK' ? 'J' : 
                    card.value === 'ACE' ? 'A' : card.value;
      return sum + (cardValues[value] || 0);
    }, 0);
  };

  const playerScore = calculateScore(playerCollection);
  const opponentScore = calculateScore(opponentCollection);

  const handleCardSelect = (index: number) => {
    if (!playerBid) {
      setSelectedCardIndex(index === selectedCardIndex ? null : index);
    }
  };

  const handlePlaceBid = () => {
    if (selectedCardIndex !== null && !playerBid) {
      onPlaceBid(selectedCardIndex);
      setSelectedCardIndex(null);
    }
  };

  return (
    <div className="container mx-auto p-4 ">
      <div className="bg-green-800 rounded-lg p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="text-white">
            <h2 className="text-xl font-bold">Round: {round + 1}/{maxRounds}</h2>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg">
            <p className="text-lg text-black font-semibold">{message}</p>
          </div>
        </div>

        {/* Opponent's area */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white text-lg font-bold">{opponentName || 'Opponent'}</h3>
            <div className="bg-white text-black px-3 py-1 rounded-lg">
              <p className="font-semibold">Score: {opponentScore}</p>
            </div>
          </div>
          
          <div className="flex justify-center mb-2 ">
            {/* Opponent's hand (face down) */}
            <div className="flex  w-screen">
              {Array.from({ length: opponentHandCount }).map((_, index) => (
                <Card 
                  key={index} 
                  suit="?" 
                  value="?" 
                  faceDown={true} 
                  cardBackImage={cardBackImage}
                  size="small"
                />
              ))}
            </div>
          </div>
          
          {/* Opponent's bid - face down until revealed */}
          {opponentHasBid && (
            <div className="flex justify-center">
              <div className="text-center">
                <p className="text-white text-sm mb-1">Opponent's Bid</p>
                {bidsRevealed && opponentBid ? (
                  <Card 
                    suit={opponentBid.suit} 
                    value={opponentBid.value} 
                    image={opponentBid.image}
                    size="small"
                  />
                ) : (
                  <Card 
                    suit="?" 
                    value="?" 
                    faceDown={true}
                    cardBackImage={cardBackImage}
                    size="small"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center area - Auction card */}
        <div className="flex justify-center items-center mb-4 bg-green-700 p-3 rounded-lg">
          {currentAuctionCard && (
            <div className="text-center">
              <p className="text-white mb-2 font-bold">Current Auction Card</p>
              <Card 
                suit={currentAuctionCard.suit} 
                value={currentAuctionCard.value} 
                image={currentAuctionCard.image}
                size="medium"
              />
            </div>
          )}
        </div>

        {/* Bid status area */}
        {(playerBid || opponentHasBid) && (
          <div className="mb-4 text-center bg-yellow-800 p-2 rounded-lg">
            <h3 className="text-white font-bold mb-1">Bid Status</h3>
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <p className="text-white text-sm">Your Bid</p>
                <div className="mt-1">
                  {playerBid ? (
                    <div className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                      Placed
                    </div>
                  ) : (
                    <div className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                      Not Placed
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center">
                <p className="text-white text-sm">Opponent's Bid</p>
                <div className="mt-1">
                  {opponentHasBid ? (
                    <div className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                      Placed
                    </div>
                  ) : (
                    <div className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                      Not Placed
                    </div>
                  )}
                </div>
              </div>
            </div>
            {playerBid && opponentHasBid && !bidsRevealed && (
              <p className="text-white text-sm mt-2">
                Waiting for bids to be revealed...
              </p>
            )}
            {bidsRevealed && (
              <p className="text-white text-sm mt-2">
                Bids have been revealed!
              </p>
            )}
          </div>
        )}

        {/* Collections display */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className=" bg-opacity-10 p-2 rounded-lg">
            <h3 className=" text-sm font-bold mb-1">Your Collection</h3>
            <div className="flex flex-wrap gap-1 justify-center">
              {playerCollection.map((card, index) => (
                <div key={index} className="w-8 h-12 relative">
                  {card.image ? (
                    <img 
                      src={card.image} 
                      alt={`${card.value} of ${card.suit}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Card 
                      suit={card.suit} 
                      value={card.value}
                      size="tiny"
                    />
                  )}
                </div>
              ))}
              {playerCollection.length === 0 && (
                <p className="text-white text-xs italic">No cards yet</p>
              )}
            </div>
          </div>
          <div className="bg-slate-800 bg-opacity-10 p-2 rounded-lg">
            <h3 className="text-white text-sm font-bold mb-1">{opponentName || 'Opponent'}'s Collection</h3>
            <div className="flex flex-wrap gap-1 justify-center">
              {opponentCollection.map((card, index) => (
                <div key={index} className="w-8 h-12 relative">
                  {card.image ? (
                    <img 
                      src={card.image} 
                      alt={`${card.value} of ${card.suit}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Card 
                      suit={card.suit} 
                      value={card.value}
                      size="tiny"
                    />
                  )}
                </div>
              ))}
              {opponentCollection.length === 0 && (
                <p className="text-white text-xs italic">No cards yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Player's area */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white text-lg font-bold">Your Cards</h3>
            <div className="bg-white px-3 py-1 rounded-lg">
              <p className="font-semibold">Score: {playerScore}</p>
            </div>
          </div>
          
          {/* Player's bid - show face up to the player */}
          {playerBid && (
            <div className="flex justify-center mb-2">
              <div className="text-center">
                <p className="text-white text-sm mb-1">Your Bid</p>
                <Card 
                  suit={playerBid.suit} 
                  value={playerBid.value} 
                  image={playerBid.image}
                  size="small"
                />
              </div>
            </div>
          )}
          
          {/* Player's hand */}
          <div className="flex flex-wrap justify-center overflow-x-auto">
            {hand.map((card, index) => (
              <Card 
                key={index} 
                suit={card.suit} 
                value={card.value} 
                image={card.image}
                selectable={!playerBid && selectedCardIndex !== index}
                onClick={() => handleCardSelect(index)}
                size="small"
              />
            ))}
          </div>
          
          {/* Selected card and bid button */}
          {selectedCardIndex !== null && !playerBid && (
            <div className="mt-4 flex flex-col items-center">
              <p className="text-white mb-2">Selected Card:</p>
              <Card 
                suit={hand[selectedCardIndex].suit} 
                value={hand[selectedCardIndex].value} 
                image={hand[selectedCardIndex].image}
                size="medium"
              />
              <button 
                className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={handlePlaceBid}
              >
                Place Bid
              </button>
            </div>
          )}
        </div>

        {/* Game over screen */}
        {gameOver && scores && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
            <div className="bg-white text-black p-8 rounded-lg max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4 text-center">Game Over</h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Final Scores</h3>
                <div className="flex justify-between border-b pb-2 mb-2">
                  <span>You ({gameState.playerName})</span>
                  <span className="font-bold">{playerScore}</span>
                </div>
                <div className="flex justify-between">
                  <span>{opponentName || 'Opponent'}</span>
                  <span className="font-bold">{opponentScore}</span>
                </div>
              </div>
              
              <div className="text-center text-xl font-bold mb-6">
                {playerScore > opponentScore ? 'You Win!' : 
                 playerScore < opponentScore ? 'You Lose!' : 'It\'s a Tie!'}
              </div>
              
              <button 
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => window.location.reload()}
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoard; 