import { Card, Color, CardType } from '@/lib/game/types';

/**
 * Get the image path for a card based on its properties
 */
export function getCardImagePath(card: Card): string {
  // Handle wild cards
  if (card.color === null) {
    switch (card.type) {
      case 'wild_color_roulette':
        return '/cards/color_roulette_wild_1.png';
      case 'wild_draw_6':
        return '/cards/wild_draw6_blue.png';
      case 'wild_draw_10':
        return '/cards/wild_draw10_yellow.png';
      case 'wild_reverse_draw_4':
        return '/cards/wild_stackable_draw4_1.png';
      default:
        return '/cards/logo.png';
    }
  }

  const color = card.color;

  // Handle number cards
  if (card.type === 'number') {
    return `/cards/${color}-${card.value}.png`;
  }

  // Handle action cards
  switch (card.type) {
    case 'skip':
      return `/cards/${color}-skip.png`;
    case 'skip_all':
      return `/cards/${color}-skip.png`; // Using regular skip for skip_all
    case 'reverse':
      return `/cards/${color}-reverse.png`;
    case 'draw_2':
      return `/cards/${color}-draw2.png`;
    case 'draw_4':
      return `/cards/draw4_${color}.png`;
    case 'discard_all':
      return `/cards/discard_all_${color}.png`;
    default:
      return '/cards/logo.png';
  }
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
