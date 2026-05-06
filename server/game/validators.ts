import { Card, Color, CardType } from '@/lib/game/types';
import {
  isWildCard,
  isDrawCard,
  isStackableCard,
  getDrawPenalty,
} from '@/lib/game/constants';

/**
 * Check if a card can be played on top of another card
 */
export function canPlayCard(
  cardToPlay: Card,
  topCard: Card,
  currentColor: Color | null,
  pendingPenalty: number
): boolean {
  // If there's a pending penalty, player must either stack or draw
  if (pendingPenalty > 0) {
    // Can only play if it's a stackable draw card with equal or higher penalty
    if (!isStackableCard(cardToPlay.type)) {
      return false;
    }
    const cardPenalty = getDrawPenalty(cardToPlay.type);
    const topCardPenalty = getDrawPenalty(topCard.type);

    // Card must have equal or higher penalty
    if (cardPenalty < topCardPenalty) {
      return false;
    }

    // Wild draw cards can always stack regardless of color
    if (isWildCard(cardToPlay.type)) {
      return true;
    }

    // For colored draw cards (draw_2, draw_4), they can stack if:
    // 1. Same penalty or higher (already checked above)
    // 2. Match the current color (if there is a current color)
    if (currentColor !== null && cardToPlay.color !== null) {
      return cardToPlay.color === currentColor;
    }

    // If no current color (shouldn't happen), allow the stack
    return true;
  }

  // No pending penalty - normal play rules
  // Wild cards can always be played
  if (isWildCard(cardToPlay.type)) {
    return true;
  }

  // Match by color - can play ANY card of the current color
  if (cardToPlay.color === currentColor || cardToPlay.color === topCard.color) {
    return true;
  }

  // Match by value (for number cards)
  if (
    cardToPlay.type === 'number' &&
    topCard.type === 'number' &&
    cardToPlay.value === topCard.value
  ) {
    return true;
  }

  // Match by type (e.g., Skip on Skip, Reverse on Reverse)
  if (cardToPlay.type === topCard.type && topCard.type !== 'number') {
    return true;
  }

  return false;
}

/**
 * Check if a card can be stacked on a draw card
 */
export function canStackCard(cardToStack: Card, topCard: Card): boolean {
  if (!isStackableCard(cardToStack.type) || !isDrawCard(topCard.type)) {
    return false;
  }

  const stackPenalty = getDrawPenalty(cardToStack.type);
  const topPenalty = getDrawPenalty(topCard.type);

  // Can stack if penalty is equal or higher
  return stackPenalty >= topPenalty;
}

/**
 * Check if a player has any playable cards in their hand
 */
export function hasPlayableCard(
  hand: Card[],
  topCard: Card,
  currentColor: Color | null,
  pendingPenalty: number
): boolean {
  return hand.some((card) => canPlayCard(card, topCard, currentColor, pendingPenalty));
}

/**
 * Validate player name
 */
export function isValidPlayerName(name: string): boolean {
  return (
    typeof name === 'string' &&
    name.trim().length >= 1 &&
    name.trim().length <= 20 &&
    /^[a-zA-Z0-9\s_-]+$/.test(name.trim())
  );
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code: string): boolean {
  return typeof code === 'string' && /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Check if a color is valid
 */
export function isValidColor(color: any): color is Color {
  return ['red', 'blue', 'green', 'yellow'].includes(color);
}

/**
 * Check if a card requires color selection (wild cards)
 * Note: Wild draw cards (6/10) don't need color when stacking on a draw penalty
 */
export function requiresColorSelection(cardType: CardType, pendingPenalty?: number): boolean {
  // If there's a pending penalty and this is a stackable wild draw card, no color needed
  if (pendingPenalty && pendingPenalty > 0 &&
      (cardType === 'wild_draw_6' || cardType === 'wild_draw_10')) {
    return false;
  }

  // Otherwise all wild cards need color selection
  return isWildCard(cardType);
}

/**
 * Check if a card is a special number card (0 or 7)
 */
export function isSpecialNumberCard(card: Card): boolean {
  return card.type === 'number' && (card.value === 0 || card.value === 7);
}

/**
 * Check if a card triggers hand swap (7)
 */
export function triggersHandSwap(card: Card): boolean {
  return card.type === 'number' && card.value === 7;
}

/**
 * Check if a card triggers hand pass (0)
 */
export function triggersHandPass(card: Card): boolean {
  return card.type === 'number' && card.value === 0;
}

/**
 * Check if card triggers direction reverse
 */
export function triggersReverse(card: Card): boolean {
  return card.type === 'reverse' || card.type === 'wild_reverse_draw_4';
}

/**
 * Check if card skips next player
 */
export function skipsNextPlayer(card: Card): boolean {
  return card.type === 'skip';
}

/**
 * Check if card skips all other players
 */
export function skipsAllPlayers(card: Card): boolean {
  return card.type === 'skip_all';
}

/**
 * Check if card triggers discard all of same color
 */
export function triggersDiscardAll(card: Card): boolean {
  return card.type === 'discard_all';
}

/**
 * Check if card is Color Roulette
 */
export function isColorRoulette(card: Card): boolean {
  return card.type === 'wild_color_roulette';
}
