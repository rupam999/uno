import { Card, Color, CardType } from '@/lib/game/types';
import { COLORS, DECK_COMPOSITION, isWildCard } from '@/lib/game/constants';
import { randomUUID } from 'crypto';

export class Deck {
  private cards: Card[] = [];
  private discardPile: Card[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the deck with all 168 cards according to UNO No Mercy rules
   */
  private initialize(): void {
    this.cards = [];

    // Add colored cards for each color
    for (const color of COLORS) {
      // Add number cards (2 of each 0-9)
      for (const [number, count] of Object.entries(DECK_COMPOSITION.COLORED_CARDS_PER_COLOR.NUMBERS)) {
        for (let i = 0; i < count; i++) {
          this.cards.push(this.createCard('number', color, parseInt(number)));
        }
      }

      // Add action cards
      for (let i = 0; i < DECK_COMPOSITION.COLORED_CARDS_PER_COLOR.SKIP; i++) {
        this.cards.push(this.createCard('skip', color));
      }

      for (let i = 0; i < DECK_COMPOSITION.COLORED_CARDS_PER_COLOR.SKIP_ALL; i++) {
        this.cards.push(this.createCard('skip_all', color));
      }

      for (let i = 0; i < DECK_COMPOSITION.COLORED_CARDS_PER_COLOR.REVERSE; i++) {
        this.cards.push(this.createCard('reverse', color));
      }

      for (let i = 0; i < DECK_COMPOSITION.COLORED_CARDS_PER_COLOR.DRAW_2; i++) {
        this.cards.push(this.createCard('draw_2', color));
      }

      for (let i = 0; i < DECK_COMPOSITION.COLORED_CARDS_PER_COLOR.DRAW_4; i++) {
        this.cards.push(this.createCard('draw_4', color));
      }

      for (let i = 0; i < DECK_COMPOSITION.COLORED_CARDS_PER_COLOR.DISCARD_ALL; i++) {
        this.cards.push(this.createCard('discard_all', color));
      }
    }

    // Add wild cards (no color)
    for (let i = 0; i < DECK_COMPOSITION.WILD_CARDS.WILD_DRAW_6; i++) {
      this.cards.push(this.createCard('wild_draw_6', null));
    }

    for (let i = 0; i < DECK_COMPOSITION.WILD_CARDS.WILD_DRAW_10; i++) {
      this.cards.push(this.createCard('wild_draw_10', null));
    }

    for (let i = 0; i < DECK_COMPOSITION.WILD_CARDS.WILD_REVERSE_DRAW_4; i++) {
      this.cards.push(this.createCard('wild_reverse_draw_4', null));
    }

    for (let i = 0; i < DECK_COMPOSITION.WILD_CARDS.WILD_COLOR_ROULETTE; i++) {
      this.cards.push(this.createCard('wild_color_roulette', null));
    }
  }

  /**
   * Create a card with a unique ID
   */
  private createCard(type: CardType, color: Color | null, value: number | null = null): Card {
    return {
      id: randomUUID(),
      type,
      color,
      value,
    };
  }

  /**
   * Shuffle the deck using Fisher-Yates algorithm
   */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Draw a card from the deck
   * If deck is empty, reshuffle discard pile (keeping top card)
   */
  draw(): Card | null {
    if (this.cards.length === 0) {
      this.reshuffleDiscardPile();
    }

    if (this.cards.length === 0) {
      return null; // No cards available
    }

    return this.cards.pop() || null;
  }

  /**
   * Draw multiple cards
   */
  drawMultiple(count: number): Card[] {
    const drawnCards: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.draw();
      if (card) {
        drawnCards.push(card);
      } else {
        break; // No more cards available
      }
    }
    return drawnCards;
  }

  /**
   * Add a card to the discard pile
   */
  discard(card: Card): void {
    this.discardPile.push(card);
  }

  /**
   * Get the top card from the discard pile without removing it
   */
  getTopCard(): Card | null {
    if (this.discardPile.length === 0) {
      return null;
    }
    return this.discardPile[this.discardPile.length - 1];
  }

  /**
   * Get the number of cards remaining in the deck
   */
  getCount(): number {
    return this.cards.length;
  }

  /**
   * Get the discard pile size
   */
  getDiscardPileSize(): number {
    return this.discardPile.length;
  }

  /**
   * Reshuffle discard pile back into deck (keeping the top card)
   */
  private reshuffleDiscardPile(): void {
    if (this.discardPile.length <= 1) {
      return; // Keep at least the top card
    }

    // Keep the top card, shuffle the rest back into the deck
    const topCard = this.discardPile.pop()!;
    this.cards = [...this.discardPile];
    this.discardPile = [topCard];
    this.shuffle();
  }

  /**
   * Deal initial hands to players
   */
  dealHands(playerCount: number, cardsPerPlayer: number): Card[][] {
    const hands: Card[][] = [];
    for (let i = 0; i < playerCount; i++) {
      hands.push(this.drawMultiple(cardsPerPlayer));
    }
    return hands;
  }

  /**
   * Find a starting card (not wild, not action card that's too powerful)
   * For game initialization
   */
  findStartingCard(): Card | null {
    // Look for a simple number card or basic action card
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      if (
        !isWildCard(card.type) &&
        card.type !== 'skip_all' &&
        card.type !== 'draw_2' &&
        card.type !== 'draw_4' &&
        card.type !== 'wild_draw_6' &&
        card.type !== 'wild_draw_10' &&
        card.type !== 'wild_reverse_draw_4'
      ) {
        // Remove this card from deck and return it
        this.cards.splice(i, 1);
        return card;
      }
    }

    // If no simple card found, just take the first non-wild card
    for (let i = 0; i < this.cards.length; i++) {
      if (!isWildCard(this.cards[i].type)) {
        const card = this.cards.splice(i, 1)[0];
        return card;
      }
    }

    // Fallback: return any card
    return this.cards.pop() || null;
  }

  /**
   * Reset the deck (for testing or new rounds)
   */
  reset(): void {
    this.cards = [];
    this.discardPile = [];
    this.initialize();
  }
}
