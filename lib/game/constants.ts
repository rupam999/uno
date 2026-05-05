import { Color, CardType } from './types';
import unoRules from '@/app/uno.json';

// Game configuration from uno.json
export const GAME_CONFIG = {
  TOTAL_CARDS: unoRules.game_meta.total_cards,
  STARTING_HAND_SIZE: unoRules.game_meta.starting_hand_size,
  MAX_HAND_SIZE_LIMIT: unoRules.game_meta.max_hand_size_limit,
  ELIMINATION_POINTS: unoRules.game_meta.elimination_points,
  TARGET_SCORE: unoRules.game_meta.target_score,
  MAX_PLAYERS: 10,
  MIN_PLAYERS: 2,
  RECONNECT_GRACE_PERIOD: 5 * 60 * 1000, // 5 minutes in milliseconds
  HEARTBEAT_INTERVAL: 30 * 1000, // 30 seconds
  DISCONNECT_TIMEOUT: 60 * 1000, // 60 seconds
  ROOM_CLEANUP_TIMEOUT: 10 * 60 * 1000, // 10 minutes
} as const;

// Colors
export const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];

// Card point values for scoring
export const CARD_POINTS: Record<CardType, number> = {
  number: 0, // face value used instead
  skip: 20,
  skip_all: 20,
  reverse: 20,
  draw_2: 20,
  draw_4: 20,
  discard_all: 20,
  wild: 50,
  wild_draw_6: 50,
  wild_draw_10: 50,
  wild_reverse_draw_4: 50,
  wild_color_roulette: 50,
};

// Deck composition from uno.json
export const DECK_COMPOSITION = {
  COLORED_CARDS_PER_COLOR: {
    NUMBERS: {
      '0': 2,
      '1': 2,
      '2': 2,
      '3': 2,
      '4': 2,
      '5': 2,
      '6': 2,
      '7': 2,
      '8': 2,
      '9': 2,
    },
    SKIP: 3,
    SKIP_ALL: 2,
    REVERSE: 3,
    DRAW_2: 2,
    DRAW_4: 2,
    DISCARD_ALL: 3,
  },
  WILD_CARDS: {
    WILD: 0, // Not in No Mercy edition
    WILD_DRAW_6: unoRules.deck_breakdown.wild_cards.wild_draw_6,
    WILD_DRAW_10: unoRules.deck_breakdown.wild_cards.wild_draw_10,
    WILD_REVERSE_DRAW_4: unoRules.deck_breakdown.wild_cards.wild_reverse_draw_4,
    WILD_COLOR_ROULETTE: unoRules.deck_breakdown.wild_cards.wild_color_roulette,
  },
} as const;

// Special card behaviors
export const SPECIAL_CARDS = {
  ZERO: 0, // Pass hands
  SEVEN: 7, // Swap hands
} as const;

// Draw card penalties
export const DRAW_PENALTIES: Record<string, number> = {
  draw_2: 2,
  draw_4: 4,
  wild_draw_6: 6,
  wild_draw_10: 10,
  wild_reverse_draw_4: 4,
};

// Card types that are wild (can be played on any color)
export const WILD_CARD_TYPES: CardType[] = [
  'wild',
  'wild_draw_6',
  'wild_draw_10',
  'wild_reverse_draw_4',
  'wild_color_roulette',
];

// Card types that trigger drawing
export const DRAW_CARD_TYPES: CardType[] = [
  'draw_2',
  'draw_4',
  'wild_draw_6',
  'wild_draw_10',
  'wild_reverse_draw_4',
];

// Card types that can be stacked
export const STACKABLE_CARD_TYPES: CardType[] = [
  'draw_2',
  'draw_4',
  'wild_draw_6',
  'wild_draw_10',
  'wild_reverse_draw_4',
];

// Action cards
export const ACTION_CARD_TYPES: CardType[] = [
  'skip',
  'skip_all',
  'reverse',
  'discard_all',
];

// Helper functions
export function isWildCard(cardType: CardType): boolean {
  return WILD_CARD_TYPES.includes(cardType);
}

export function isDrawCard(cardType: CardType): boolean {
  return DRAW_CARD_TYPES.includes(cardType);
}

export function isActionCard(cardType: CardType): boolean {
  return ACTION_CARD_TYPES.includes(cardType);
}

export function isStackableCard(cardType: CardType): boolean {
  return STACKABLE_CARD_TYPES.includes(cardType);
}

export function getDrawPenalty(cardType: CardType): number {
  return DRAW_PENALTIES[cardType] || 0;
}

export function getCardPoints(cardType: CardType, value: number | null): number {
  if (cardType === 'number' && value !== null) {
    return value;
  }
  return CARD_POINTS[cardType] || 0;
}
