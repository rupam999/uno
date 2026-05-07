import { Card, PublicPlayer } from '@/lib/game/types';
import { getCardPoints } from '@/lib/game/constants';

export class Player {
  id: string;
  name: string;
  hand: Card[] = [];
  score: number = 0;
  isEliminated: boolean = false;
  isConnected: boolean = true;
  isHost: boolean = false;
  calledUno: boolean = false;
  lastSeen: number = Date.now();
  allianceId: string | null = null; // Add alliance tracking

  constructor(id: string, name: string, isHost: boolean = false) {
    this.id = id;
    this.name = name;
    this.isHost = isHost;
    this.allianceId = null;
  }

  /**
   * Add a card to the player's hand
   */
  addCard(card: Card): void {
    this.hand.push(card);
    this.resetUnoStatus();
  }

  /**
   * Add multiple cards to the player's hand
   */
  addCards(cards: Card[]): void {
    this.hand.push(...cards);
    this.resetUnoStatus();
  }

  /**
   * Remove a card from the player's hand by card ID
   */
  removeCard(cardId: string): Card | null {
    const index = this.hand.findIndex((c) => c.id === cardId);
    if (index !== -1) {
      const card = this.hand.splice(index, 1)[0];
      return card;
    }
    return null;
  }

  /**
   * Remove all cards of a specific color (for Discard All card)
   */
  removeCardsByColor(color: string): Card[] {
    const removedCards = this.hand.filter((card) => card.color === color);
    this.hand = this.hand.filter((card) => card.color !== color);
    this.resetUnoStatus();
    return removedCards;
  }

  /**
   * Get a card by ID without removing it
   */
  getCard(cardId: string): Card | null {
    return this.hand.find((c) => c.id === cardId) || null;
  }

  /**
   * Check if player has a specific card
   */
  hasCard(cardId: string): boolean {
    return this.hand.some((c) => c.id === cardId);
  }

  /**
   * Get the number of cards in hand
   */
  getHandSize(): number {
    return this.hand.length;
  }

  /**
   * Calculate the total points value of cards in hand
   */
  calculateHandScore(): number {
    return this.hand.reduce((total, card) => {
      return total + getCardPoints(card.type, card.value);
    }, 0);
  }

  /**
   * Set player's hand (for hand swapping)
   */
  setHand(newHand: Card[]): void {
    this.hand = newHand;
    this.resetUnoStatus();
  }

  /**
   * Clear all cards from hand
   */
  clearHand(): void {
    this.hand = [];
    this.resetUnoStatus();
  }

  /**
   * Mark player as having called UNO
   */
  callUno(): void {
    this.calledUno = true;
  }

  /**
   * Reset UNO status (called when drawing cards or after playing)
   */
  resetUnoStatus(): void {
    if (this.hand.length !== 1) {
      this.calledUno = false;
    }
  }

  /**
   * Check if player should call UNO (has exactly 1 card and hasn't called it)
   */
  shouldCallUno(): boolean {
    return this.hand.length === 1 && !this.calledUno;
  }

  /**
   * Add points to player's score
   */
  addScore(points: number): void {
    this.score += points;
  }

  /**
   * Eliminate this player
   */
  eliminate(): void {
    this.isEliminated = true;
  }

  /**
   * Mark player as disconnected
   */
  disconnect(): void {
    this.isConnected = false;
    this.lastSeen = Date.now();
  }

  /**
   * Mark player as reconnected
   */
  reconnect(): void {
    this.isConnected = true;
    this.lastSeen = Date.now();
  }

  /**
   * Update last seen timestamp
   */
  updateLastSeen(): void {
    this.lastSeen = Date.now();
  }

  /**
   * Set player's alliance
   */
  setAlliance(allianceId: string | null): void {
    this.allianceId = allianceId;
  }

  /**
   * Check if player has been disconnected longer than grace period
   */
  isDisconnectedTooLong(gracePeriod: number): boolean {
    if (this.isConnected) {
      return false;
    }
    return Date.now() - this.lastSeen > gracePeriod;
  }

  /**
   * Convert to public player view (hide cards)
   */
  toPublicPlayer(): PublicPlayer {
    return {
      id: this.id,
      name: this.name,
      cardCount: this.hand.length,
      score: this.score,
      isEliminated: this.isEliminated,
      isConnected: this.isConnected,
      isHost: this.isHost,
      calledUno: this.calledUno,
      allianceId: this.allianceId, // Add alliance fields
      allianceName: null, // Will be filled by GameRoom
    };
  }

  /**
   * Sort hand by color and value (for better UX)
   */
  sortHand(): void {
    const colorOrder = { red: 0, blue: 1, green: 2, yellow: 3, null: 4 };

    this.hand.sort((a, b) => {
      // First sort by color
      const colorA = colorOrder[a.color || 'null'] || 4;
      const colorB = colorOrder[b.color || 'null'] || 4;
      if (colorA !== colorB) {
        return colorA - colorB;
      }

      // Then by type (numbers first, then actions, then wilds)
      if (a.type === 'number' && b.type !== 'number') return -1;
      if (a.type !== 'number' && b.type === 'number') return 1;

      // If both are numbers, sort by value
      if (a.type === 'number' && b.type === 'number') {
        return (a.value || 0) - (b.value || 0);
      }

      // Sort by type name for actions
      return a.type.localeCompare(b.type);
    });
  }
}
