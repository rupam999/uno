import { Card, Color, Direction, GameState, RoomState, ClientGameState } from '@/lib/game/types';
import { Player } from './Player';
import { Deck } from './Deck';
import {
  GAME_CONFIG,
  isDrawCard,
  getDrawPenalty,
  GAME_CONFIG as CONFIG,
} from '@/lib/game/constants';
import {
  canPlayCard,
  hasPlayableCard,
  triggersHandSwap,
  triggersHandPass,
  triggersReverse,
  skipsNextPlayer,
  skipsAllPlayers,
  triggersDiscardAll,
  isColorRoulette,
  requiresColorSelection,
} from './validators';

export class GameRoom {
  id: string;
  state: RoomState = 'waiting';
  players: Map<string, Player> = new Map();
  deck: Deck;
  currentPlayerIndex: number = 0;
  direction: Direction = 1;
  currentColor: Color | null = null;
  topCard: Card | null = null;
  pendingPenalty: number = 0;
  pendingPenaltyType: Card['type'] | null = null;
  waitingForPlayerChoice: boolean = false;
  roundNumber: number = 1;
  createdAt: number = Date.now();
  startedAt: number | null = null;
  lastActivity: number = Date.now();
  unoCallWindow: { playerId: string; timestamp: number } | null = null; // Track who needs to call UNO
  unoCatchWindow: number = 3000; // 3 seconds to catch someone who didn't call UNO

  constructor(roomId: string) {
    this.id = roomId;
    this.deck = new Deck();
  }

  /**
   * Add a player to the room
   */
  addPlayer(playerId: string, playerName: string): boolean {
    if (this.players.size >= CONFIG.MAX_PLAYERS) {
      return false;
    }

    if (this.state !== 'waiting') {
      return false;
    }

    const isHost = this.players.size === 0;
    const player = new Player(playerId, playerName, isHost);
    this.players.set(playerId, player);
    this.updateActivity();
    return true;
  }

  /**
   * Remove a player from the room
   */
  removePlayer(playerId: string): boolean {
    const player = this.players.get(playerId);
    if (!player) {
      return false;
    }

    // If host leaves, transfer to next player
    if (player.isHost && this.players.size > 1) {
      this.transferHost();
    }

    this.players.delete(playerId);
    this.updateActivity();

    // If player was eliminated and only one remains, that player wins
    if (this.state === 'playing') {
      this.checkGameEnd();
    }

    return true;
  }

  /**
   * Transfer host to another player
   */
  private transferHost(): void {
    const currentHost = Array.from(this.players.values()).find((p) => p.isHost);
    if (currentHost) {
      currentHost.isHost = false;
    }

    // Give host to next connected, non-eliminated player
    const newHost = Array.from(this.players.values()).find(
      (p) => !p.isEliminated && p.isConnected
    );
    if (newHost) {
      newHost.isHost = true;
    }
  }

  /**
   * Start the game
   */
  startGame(): boolean {
    if (this.state !== 'waiting') {
      return false;
    }

    if (this.players.size < CONFIG.MIN_PLAYERS) {
      return false;
    }

    this.state = 'playing';
    this.startedAt = Date.now();

    // Shuffle deck
    this.deck.shuffle();

    // Deal cards to players
    const playerArray = Array.from(this.players.values());
    const hands = this.deck.dealHands(playerArray.length, CONFIG.STARTING_HAND_SIZE);
    playerArray.forEach((player, index) => {
      player.setHand(hands[index]);
      player.sortHand();
    });

    // Find a starting card
    const startingCard = this.deck.findStartingCard();
    if (startingCard) {
      this.topCard = startingCard;
      this.deck.discard(startingCard);
      this.currentColor = startingCard.color;
    }

    // Set first player
    this.currentPlayerIndex = 0;
    this.updateActivity();

    return true;
  }

  /**
   * Play a card
   */
  playCard(playerId: string, cardId: string, chosenColor?: Color): {
    success: boolean;
    error?: string;
    card?: Card;
    eliminatedPlayers?: string[];
  } {
    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (this.state !== 'playing') {
      return { success: false, error: 'Game not in progress' };
    }

    if (!this.isPlayerTurn(playerId)) {
      return { success: false, error: 'Not your turn' };
    }

    const card = player.getCard(cardId);
    if (!card) {
      return { success: false, error: 'Card not in hand' };
    }

    // Validate card can be played
    if (!this.topCard || !canPlayCard(card, this.topCard, this.currentColor, this.pendingPenalty)) {
      return { success: false, error: 'Invalid card play' };
    }

    // Wild cards require color selection (unless stacking wild draw 6/10)
    if (requiresColorSelection(card.type, this.pendingPenalty) && !chosenColor) {
      return { success: false, error: 'Must choose a color for wild card' };
    }

    // Remove card from player's hand
    player.removeCard(cardId);

    // Add to discard pile
    this.deck.discard(card);
    this.topCard = card;

    // Set color
    if (chosenColor) {
      this.currentColor = chosenColor;
    } else if (this.pendingPenalty > 0 && (card.type === 'wild_draw_6' || card.type === 'wild_draw_10')) {
      // When stacking wild draw 6/10 without color choice, keep current color
      // Color stays as is
    } else {
      this.currentColor = card.color;
    }

    // Apply card effects and get eliminated players
    const eliminatedPlayers = this.applyCardEffects(card, player, chosenColor);

    // Check if player finished all cards - they win!
    if (player.getHandSize() === 0) {
      this.endRound(player);
      this.updateActivity();
      return { success: true, card, eliminatedPlayers };
    }

    // Check if player went down to 1 card without calling UNO
    if (player.getHandSize() === 1 && !player.calledUno) {
      // Open UNO catch window for other players
      this.unoCallWindow = {
        playerId: player.id,
        timestamp: Date.now(),
      };
    } else {
      // Clear UNO call window
      this.unoCallWindow = null;
    }

    this.updateActivity();

    return { success: true, card, eliminatedPlayers };
  }

  /**
   * Draw a card
   */
  drawCard(playerId: string): {
    success: boolean;
    error?: string;
    cards?: Card[];
    autoPlay?: boolean;
    canPlay?: boolean;
    eliminatedPlayer?: boolean;
  } {
    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (this.state !== 'playing') {
      return { success: false, error: 'Game not in progress' };
    }

    if (!this.isPlayerTurn(playerId)) {
      return { success: false, error: 'Not your turn' };
    }

    const drawnCards: Card[] = [];

    // If there's a pending penalty, player must draw that many cards
    if (this.pendingPenalty > 0) {
      const cards = this.deck.drawMultiple(this.pendingPenalty);
      player.addCards(cards);
      drawnCards.push(...cards);
      this.pendingPenalty = 0;
      this.pendingPenaltyType = null;

      // Check mercy rule
      if (player.getHandSize() >= CONFIG.MAX_HAND_SIZE_LIMIT) {
        player.eliminate();
        this.nextTurn();
        this.checkGameEnd();
        this.updateActivity();
        return { success: true, cards: drawnCards, eliminatedPlayer: true };
      }

      this.nextTurn();
      this.updateActivity();
      return { success: true, cards: drawnCards };
    }

    // Normal draw: Draw ONE card only
    const card = this.deck.draw();
    if (!card) {
      // No more cards in deck
      this.nextTurn();
      this.updateActivity();
      return { success: true, cards: [] };
    }

    drawnCards.push(card);
    player.addCard(card);

    // Check if drawn card is playable
    const isPlayable = this.topCard && canPlayCard(card, this.topCard, this.currentColor, 0);

    // Check mercy rule
    if (player.getHandSize() >= CONFIG.MAX_HAND_SIZE_LIMIT) {
      player.eliminate();
      this.nextTurn();
      this.checkGameEnd();
      this.updateActivity();
      return { success: true, cards: drawnCards, eliminatedPlayer: true };
    }

    this.updateActivity();

    // Player can choose to play the drawn card if it's playable
    // Otherwise turn passes automatically
    if (!isPlayable) {
      this.nextTurn();
    }

    return { success: true, cards: drawnCards, autoPlay: false, canPlay: !!isPlayable };
  }

  /**
   * Apply effects of a played card
   */
  private applyCardEffects(card: Card, player: Player, chosenColor?: Color): string[] {
    const eliminatedPlayers: string[] = [];

    // Handle draw cards - ADD to pending penalty for stacking
    if (isDrawCard(card.type)) {
      this.pendingPenalty += getDrawPenalty(card.type); // Changed from = to +=
      this.pendingPenaltyType = card.type;
    }

    // Handle reverse - player can play again (skips everyone)
    if (triggersReverse(card)) {
      this.direction *= -1;
      // Player plays again (don't advance turn)
      return eliminatedPlayers;
    }

    // Handle skip
    if (skipsNextPlayer(card)) {
      this.nextTurn();
    }

    // Handle skip all
    if (skipsAllPlayers(card)) {
      // Player plays again (don't advance turn)
      return eliminatedPlayers;
    }

    // Handle discard all
    if (triggersDiscardAll(card)) {
      const discardedCards = player.removeCardsByColor(card.color!);
      discardedCards.forEach((c) => this.deck.discard(c));
    }

    // Handle special number cards
    if (triggersHandSwap(card)) {
      this.waitingForPlayerChoice = true;
      return eliminatedPlayers;
    }

    if (triggersHandPass(card)) {
      this.passHands();
    }

    // Handle Color Roulette
    if (isColorRoulette(card) && chosenColor) {
      this.waitingForPlayerChoice = false;
      // Next player will draw until they get the chosen color
      // This is handled in the next player's turn
    }

    // Advance to next turn (unless reverse or skip all was played)
    if (!skipsAllPlayers(card) && !triggersReverse(card)) {
      this.nextTurn();
    }

    return eliminatedPlayers;
  }

  /**
   * Swap hands between two players (for 7 card)
   */
  swapHands(playerId: string, targetId: string): boolean {
    const player = this.players.get(playerId);
    const target = this.players.get(targetId);

    if (!player || !target || player === target) {
      return false;
    }

    const tempHand = player.hand;
    player.setHand(target.hand);
    target.setHand(tempHand);

    this.waitingForPlayerChoice = false;
    this.nextTurn();
    this.updateActivity();

    return true;
  }

  /**
   * Pass all hands in the current direction (for 0 card)
   */
  private passHands(): void {
    const playerArray = this.getActivePlayers();
    if (playerArray.length < 2) {
      return;
    }

    const hands = playerArray.map((p) => p.hand);

    if (this.direction === 1) {
      // Clockwise - each player gets the hand from their left
      const lastHand = hands[hands.length - 1];
      for (let i = hands.length - 1; i > 0; i--) {
        playerArray[i].setHand(hands[i - 1]);
      }
      playerArray[0].setHand(lastHand);
    } else {
      // Counter-clockwise - each player gets the hand from their right
      const firstHand = hands[0];
      for (let i = 0; i < hands.length - 1; i++) {
        playerArray[i].setHand(hands[i + 1]);
      }
      playerArray[playerArray.length - 1].setHand(firstHand);
    }
  }

  /**
   * Call UNO
   */
  callUno(playerId: string): boolean {
    const player = this.players.get(playerId);
    if (!player) {
      return false;
    }

    if (player.getHandSize() === 1) {
      player.callUno();
      // Clear UNO call window if this player was in it
      if (this.unoCallWindow?.playerId === playerId) {
        this.unoCallWindow = null;
      }
      this.updateActivity();
      return true;
    }

    return false;
  }

  /**
   * Challenge/Catch a player who didn't call UNO
   */
  challengeUno(challengerId: string, targetId: string): {
    success: boolean;
    error?: string;
    penaltyApplied?: boolean;
  } {
    const challenger = this.players.get(challengerId);
    const target = this.players.get(targetId);

    if (!challenger || !target) {
      return { success: false, error: 'Player not found' };
    }

    // Check if there's an active UNO call window for the target
    if (!this.unoCallWindow || this.unoCallWindow.playerId !== targetId) {
      return { success: false, error: 'No active UNO challenge window for this player' };
    }

    // Check if window has expired
    if (Date.now() - this.unoCallWindow.timestamp > this.unoCatchWindow) {
      this.unoCallWindow = null;
      return { success: false, error: 'Challenge window has expired' };
    }

    // Check if target actually didn't call UNO
    if (target.calledUno) {
      return { success: false, error: 'Player already called UNO' };
    }

    // Apply penalty: target draws 2 cards
    const penaltyCards = this.deck.drawMultiple(2);
    target.addCards(penaltyCards);

    // Clear the UNO call window
    this.unoCallWindow = null;

    this.updateActivity();

    return { success: true, penaltyApplied: true };
  }

  /**
   * Move to next player's turn
   */
  private nextTurn(): void {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 0) {
      return;
    }

    do {
      this.currentPlayerIndex += this.direction;

      // Wrap around
      if (this.currentPlayerIndex >= activePlayers.length) {
        this.currentPlayerIndex = 0;
      } else if (this.currentPlayerIndex < 0) {
        this.currentPlayerIndex = activePlayers.length - 1;
      }

      const currentPlayer = activePlayers[this.currentPlayerIndex];
      if (currentPlayer && !currentPlayer.isEliminated && currentPlayer.isConnected) {
        break;
      }
    } while (true);
  }

  /**
   * Get currently active (non-eliminated, connected) players
   */
  getActivePlayers(): Player[] {
    return Array.from(this.players.values()).filter(
      (p) => !p.isEliminated && p.isConnected
    );
  }

  /**
   * Get current player
   */
  getCurrentPlayer(): Player | null {
    const activePlayers = this.getActivePlayers();
    return activePlayers[this.currentPlayerIndex] || null;
  }

  /**
   * Check if it's a specific player's turn
   */
  isPlayerTurn(playerId: string): boolean {
    const currentPlayer = this.getCurrentPlayer();
    return currentPlayer?.id === playerId;
  }

  /**
   * End the current round
   */
  private endRound(winner: Player): void {
    // Calculate points
    let points = 0;
    this.players.forEach((player) => {
      if (player.id !== winner.id && !player.isEliminated) {
        points += player.calculateHandScore();
      }
    });

    winner.addScore(points);

    // End the game immediately when someone wins a round
    this.endGame(winner);
  }

  /**
   * Start next round
   */
  private startNextRound(): void {
    this.roundNumber++;

    // Clear all hands
    this.players.forEach((player) => {
      player.clearHand();
    });

    // Reset deck
    this.deck.reset();
    this.deck.shuffle();

    // Deal new hands
    const playerArray = Array.from(this.players.values());
    const hands = this.deck.dealHands(playerArray.length, CONFIG.STARTING_HAND_SIZE);
    playerArray.forEach((player, index) => {
      player.setHand(hands[index]);
      player.sortHand();
    });

    // New starting card
    const startingCard = this.deck.findStartingCard();
    if (startingCard) {
      this.topCard = startingCard;
      this.deck.discard(startingCard);
      this.currentColor = startingCard.color;
    }

    // Reset game state
    this.pendingPenalty = 0;
    this.pendingPenaltyType = null;
    this.currentPlayerIndex = 0;
    this.direction = 1;
  }

  /**
   * End the game
   */
  private endGame(winner: Player): void {
    this.state = 'finished';
    this.updateActivity();
  }

  /**
   * Check if game should end (only one player left)
   */
  private checkGameEnd(): void {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length === 1) {
      this.endGame(activePlayers[0]);
    } else if (activePlayers.length === 0) {
      this.state = 'finished';
    }
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    this.lastActivity = Date.now();
  }

  /**
   * Check if room is inactive and should be cleaned up
   */
  isInactive(): boolean {
    return Date.now() - this.lastActivity > CONFIG.ROOM_CLEANUP_TIMEOUT;
  }

  /**
   * Convert to game state
   */
  toGameState(): GameState {
    return {
      roomId: this.id,
      state: this.state,
      players: Array.from(this.players.values()),
      currentPlayerIndex: this.currentPlayerIndex,
      direction: this.direction,
      currentColor: this.currentColor,
      topCard: this.topCard,
      deckCount: this.deck.getCount(),
      pendingPenalty: this.pendingPenalty,
      pendingPenaltyType: this.pendingPenaltyType,
      waitingForPlayerChoice: this.waitingForPlayerChoice,
      roundNumber: this.roundNumber,
      targetScore: CONFIG.TARGET_SCORE,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
    };
  }

  /**
   * Convert to client game state for a specific player
   */
  toClientGameState(playerId: string): ClientGameState {
    const player = this.players.get(playerId);
    const myHand = player ? player.hand : [];

    // Get the current player from active players list
    const activePlayers = this.getActivePlayers();
    const currentActivePlayer = activePlayers[this.currentPlayerIndex];

    // Convert to index in full players array
    const allPlayers = Array.from(this.players.values());
    const currentPlayerIndexInFullArray = allPlayers.findIndex(
      (p) => p.id === currentActivePlayer?.id
    );

    return {
      roomId: this.id,
      state: this.state,
      players: allPlayers.map((p) => p.toPublicPlayer()),
      myHand,
      myPlayerId: playerId,
      currentPlayerIndex: currentPlayerIndexInFullArray >= 0 ? currentPlayerIndexInFullArray : 0,
      direction: this.direction,
      currentColor: this.currentColor,
      topCard: this.topCard,
      deckCount: this.deck.getCount(),
      pendingPenalty: this.pendingPenalty,
      pendingPenaltyType: this.pendingPenaltyType,
      waitingForPlayerChoice: this.waitingForPlayerChoice,
      roundNumber: this.roundNumber,
      targetScore: CONFIG.TARGET_SCORE,
      unoCallWindow: this.unoCallWindow,
    };
  }
}
