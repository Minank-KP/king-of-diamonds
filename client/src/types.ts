export interface Player {
  id: string;
  name: string;
  role: string;
}

export interface Card {
  suit: string;
  value: string;
}

export interface GameState {
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