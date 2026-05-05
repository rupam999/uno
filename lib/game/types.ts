// Core game types shared between client and server

export type Color = 'red' | 'blue' | 'green' | 'yellow';

export type CardType =
  | 'number'
  | 'skip'
  | 'skip_all'
  | 'reverse'
  | 'draw_2'
  | 'draw_4'
  | 'discard_all'
  | 'wild'
  | 'wild_draw_6'
  | 'wild_draw_10'
  | 'wild_reverse_draw_4'
  | 'wild_color_roulette';

export interface Card {
  id: string;
  type: CardType;
  color: Color | null; // null for wild cards
  value: number | null; // for number cards (0-9)
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  isEliminated: boolean;
  isConnected: boolean;
  isHost: boolean;
  calledUno: boolean;
  lastSeen: number; // timestamp
}

export type RoomState = 'waiting' | 'playing' | 'finished';

export type Direction = 1 | -1; // 1 = clockwise, -1 = counterclockwise

export interface GameState {
  roomId: string;
  state: RoomState;
  players: Player[];
  currentPlayerIndex: number;
  direction: Direction;
  currentColor: Color | null;
  topCard: Card | null;
  deckCount: number;
  pendingPenalty: number; // for draw stacking
  pendingPenaltyType: CardType | null; // track what type of draw card started the stack
  waitingForPlayerChoice: boolean; // for 7 swap or wild color selection
  roundNumber: number;
  targetScore: number;
  createdAt: number;
  startedAt: number | null;
}

// Simplified player view for opponents (don't reveal their cards)
export interface PublicPlayer {
  id: string;
  name: string;
  cardCount: number;
  score: number;
  isEliminated: boolean;
  isConnected: boolean;
  isHost: boolean;
  calledUno: boolean;
}

// Client receives a view of the game with their own full hand
export interface ClientGameState {
  roomId: string;
  state: RoomState;
  players: PublicPlayer[];
  myHand: Card[];
  myPlayerId: string;
  currentPlayerIndex: number;
  direction: Direction;
  currentColor: Color | null;
  topCard: Card | null;
  deckCount: number;
  pendingPenalty: number;
  pendingPenaltyType: CardType | null;
  waitingForPlayerChoice: boolean;
  roundNumber: number;
  targetScore: number;
}

// Socket event payload types
export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
}

export interface PlayCardPayload {
  roomId: string;
  playerId: string;
  cardId: string;
  chosenColor?: Color; // for wild cards
}

export interface DrawCardPayload {
  roomId: string;
  playerId: string;
}

export interface CallUnoPayload {
  roomId: string;
  playerId: string;
}

export interface ChallengeUnoPayload {
  roomId: string;
  challengerId: string;
  targetId: string;
}

export interface ChoosePlayerPayload {
  roomId: string;
  playerId: string;
  targetId: string;
}

export interface ReconnectPayload {
  roomId: string;
  playerId: string;
}

export interface LeaveRoomPayload {
  roomId: string;
  playerId: string;
}

export interface StartGamePayload {
  roomId: string;
  hostId: string;
}

// Server response types
export interface CreateRoomResponse {
  success: boolean;
  roomId: string;
  playerId: string;
  error?: string;
}

export interface JoinRoomResponse {
  success: boolean;
  playerId?: string;
  gameState?: ClientGameState;
  error?: string;
}

export interface ErrorResponse {
  error: string;
  code?: string;
}

export interface GameStartedPayload {
  gameState: ClientGameState;
}

export interface CardPlayedPayload {
  playerId: string;
  card: Card;
  newTopCard: Card;
  chosenColor?: Color;
}

export interface CardDrawnPayload {
  playerId: string;
  cardCount: number;
  drawnCard?: Card; // only sent to the player who drew
}

export interface TurnChangedPayload {
  currentPlayerId: string;
  nextPlayerId: string;
}

export interface PlayerEliminatedPayload {
  playerId: string;
  playerName: string;
  reason: 'mercy_rule' | 'score' | 'disconnect';
}

export interface HandSwappedPayload {
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
}

export interface HandsPassedPayload {
  direction: Direction;
}

export interface RoundEndedPayload {
  winnerId: string;
  winnerName: string;
  scores: Record<string, number>;
}

export interface GameEndedPayload {
  winnerId: string;
  winnerName: string;
  finalScores: Record<string, number>;
}

export interface PlayerJoinedPayload {
  playerId: string;
  playerName: string;
  playerCount: number;
}

export interface PlayerLeftPayload {
  playerId: string;
  playerName: string;
  playerCount: number;
}
