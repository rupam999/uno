import { Card, Color, CardType } from '@/lib/game/types';

// Sprite sheet configuration
// These values may need adjustment based on your actual sprite sheets
const CARD_WIDTH = 240;
const CARD_HEIGHT = 360;

// Layout assumes cards are arranged in a grid
// You may need to adjust these based on your sprite sheet layout
interface SpritePosition {
  spriteSheet: 'basic_cards.png' | 'special_cards.png';
  row: number;
  col: number;
}

/**
 * Get sprite position for a card
 * This is a simplified version - you'll need to adjust based on your actual sprite layout
 */
export function getCardSpritePosition(card: Card): SpritePosition {
  // Wild cards use special_cards.png
  if (card.color === null) {
    return getWildCardPosition(card.type);
  }

  // Regular colored cards use basic_cards.png
  return getColoredCardPosition(card);
}

/**
 * Get position for wild cards in special_cards.png
 */
function getWildCardPosition(cardType: CardType): SpritePosition {
  const positions: Record<string, { row: number; col: number }> = {
    wild: { row: 0, col: 0 },
    wild_draw_6: { row: 0, col: 1 },
    wild_draw_10: { row: 0, col: 2 },
    wild_reverse_draw_4: { row: 0, col: 3 },
    wild_color_roulette: { row: 0, col: 4 },
  };

  const pos = positions[cardType] || { row: 0, col: 0 };
  return {
    spriteSheet: 'special_cards.png',
    row: pos.row,
    col: pos.col,
  };
}

/**
 * Get position for colored cards in basic_cards.png
 * Assumes layout: Red (row 0), Blue (row 1), Green (row 2), Yellow (row 3)
 * Columns: 0-9 for numbers, then action cards
 */
function getColoredCardPosition(card: Card): SpritePosition {
  const colorRows: Record<Color, number> = {
    red: 0,
    blue: 1,
    green: 2,
    yellow: 3,
  };

  const row = colorRows[card.color as Color] || 0;
  let col = 0;

  if (card.type === 'number' && card.value !== null) {
    col = card.value; // 0-9
  } else {
    // Action cards after numbers
    const actionCols: Record<string, number> = {
      skip: 10,
      skip_all: 11,
      reverse: 12,
      draw_2: 13,
      draw_4: 14,
      discard_all: 15,
    };
    col = actionCols[card.type] || 0;
  }

  return {
    spriteSheet: 'basic_cards.png',
    row,
    col,
  };
}

/**
 * Generate CSS styles for displaying a card sprite
 */
export function getCardStyles(
  card: Card,
  width: number = 120,
  height: number = 180
): React.CSSProperties {
  const position = getCardSpritePosition(card);
  const scale = width / CARD_WIDTH;

  return {
    width: `${width}px`,
    height: `${height}px`,
    backgroundImage: `url(/${position.spriteSheet})`,
    backgroundPosition: `-${position.col * CARD_WIDTH}px -${position.row * CARD_HEIGHT}px`,
    backgroundSize: `${CARD_WIDTH * 16 * scale}px ${CARD_HEIGHT * 4 * scale}px`, // Assuming 16 columns, 4 rows
    backgroundRepeat: 'no-repeat',
    imageRendering: 'crisp-edges',
  };
}

/**
 * Get color name for display
 */
export function getColorName(color: Color | null): string {
  if (!color) return 'Wild';
  return color.charAt(0).toUpperCase() + color.slice(1);
}

/**
 * Get card display name
 */
export function getCardDisplayName(card: Card): string {
  if (card.type === 'number') {
    return `${getColorName(card.color)} ${card.value}`;
  }

  const names: Record<CardType, string> = {
    number: '',
    skip: 'Skip',
    skip_all: 'Skip All',
    reverse: 'Reverse',
    draw_2: '+2',
    draw_4: '+4',
    discard_all: 'Discard All',
    wild: 'Wild',
    wild_draw_6: 'Wild +6',
    wild_draw_10: 'Wild +10',
    wild_reverse_draw_4: 'Wild Reverse +4',
    wild_color_roulette: 'Color Roulette',
  };

  return names[card.type] || card.type;
}

/**
 * Get CSS color for a card color
 */
export function getColorCSS(color: Color | null): string {
  const colors: Record<string, string> = {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
  };
  return color ? colors[color] : '#6b7280';
}
