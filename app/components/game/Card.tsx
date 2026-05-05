'use client';

import { Card as CardType } from '@/lib/game/types';
import { getCardDisplayName, getColorCSS } from '@/lib/utils/cardSprites';

interface CardProps {
  card: CardType;
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  playable?: boolean;
  onClick?: () => void;
  className?: string;
}

const SIZE_CONFIG = {
  small: { width: 80, height: 120, fontSize: 'text-xl', titleSize: 'text-xs' },
  medium: { width: 120, height: 180, fontSize: 'text-4xl', titleSize: 'text-sm' },
  large: { width: 160, height: 240, fontSize: 'text-6xl', titleSize: 'text-base' },
};

export function Card({
  card,
  size = 'medium',
  selected = false,
  playable = false,
  onClick,
  className = '',
}: CardProps) {
  const { width, height, fontSize, titleSize } = SIZE_CONFIG[size];
  const colorCSS = getColorCSS(card.color);
  const isWild = card.color === null;

  // Get card symbol/text
  const getCardContent = () => {
    if (card.type === 'number') return card.value?.toString() || '0';
    if (card.type === 'skip') return '⊘';
    if (card.type === 'skip_all') return '⊗';
    if (card.type === 'reverse') return '⇄';
    if (card.type === 'draw_2') return '+2';
    if (card.type === 'draw_4') return '+4';
    if (card.type === 'discard_all') return '🗑';
    if (card.type === 'wild') return '🌈';
    if (card.type === 'wild_draw_6') return '+6';
    if (card.type === 'wild_draw_10') return '+10';
    if (card.type === 'wild_reverse_draw_4') return '⇄+4';
    if (card.type === 'wild_color_roulette') return '🎲';
    return '?';
  };

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden transition-all
        ${selected ? 'ring-4 ring-blue-400 -translate-y-4 shadow-2xl' : 'shadow-lg'}
        ${playable ? 'hover:scale-105 hover:-translate-y-2 cursor-pointer' : 'opacity-60'}
        ${!playable && !onClick ? 'cursor-default' : ''}
        ${className}
      `}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      onClick={onClick}
    >
      {/* Card Background */}
      <div
        className={`absolute inset-0 rounded-xl ${
          isWild
            ? 'bg-gradient-to-br from-red-500 via-yellow-500 via-green-500 to-blue-500'
            : ''
        }`}
        style={{
          backgroundColor: isWild ? undefined : colorCSS,
        }}
      >
        {/* White inner card area */}
        <div className="absolute inset-3 bg-white rounded-lg flex flex-col items-center justify-center">
          {/* Top corner number/symbol */}
          <div
            className={`absolute top-1 left-1 font-black ${titleSize}`}
            style={{ color: colorCSS }}
          >
            {getCardContent()}
          </div>

          {/* Center large number/symbol */}
          <div
            className={`font-black ${fontSize} drop-shadow-md`}
            style={{ color: isWild ? '#374151' : colorCSS }}
          >
            {getCardContent()}
          </div>

          {/* Bottom corner number/symbol (rotated) */}
          <div
            className={`absolute bottom-1 right-1 font-black ${titleSize} rotate-180`}
            style={{ color: colorCSS }}
          >
            {getCardContent()}
          </div>

          {/* Card type label for special cards */}
          {card.type !== 'number' && (
            <div
              className={`mt-2 font-bold ${size === 'small' ? 'text-[8px]' : size === 'medium' ? 'text-[10px]' : 'text-xs'} uppercase`}
              style={{ color: isWild ? '#374151' : colorCSS }}
            >
              {card.type.replace(/_/g, ' ')}
            </div>
          )}
        </div>

        {/* Decorative ellipse pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <svg width="100%" height="100%" className="absolute inset-0">
            <ellipse cx="50%" cy="50%" rx="40%" ry="45%" fill="white" />
          </svg>
        </div>
      </div>

      {/* Playable indicator */}
      {playable && !selected && (
        <div className="absolute inset-0 bg-green-400/30 rounded-xl ring-2 ring-green-400 animate-pulse" />
      )}

      {/* Selected indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
          <span className="text-white text-sm font-bold">✓</span>
        </div>
      )}
    </div>
  );
}

/**
 * Card back component (for draw pile or opponent hands)
 */
export function CardBack({
  size = 'medium',
  count,
  className = '',
}: {
  size?: 'small' | 'medium' | 'large';
  count?: number;
  className?: string;
}) {
  const { width, height } = SIZE_CONFIG[size];

  return (
    <div
      className={`relative rounded-xl overflow-hidden shadow-lg ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {/* Colorful gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-yellow-500 to-blue-600">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-30">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern)" />
          </svg>
        </div>

        {/* Center UNO logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white font-black text-3xl drop-shadow-2xl tracking-wider rotate-[-15deg] transform scale-110">
              UNO
            </div>
            <div className="text-white/80 font-bold text-xs mt-1">NO MERCY</div>
          </div>
        </div>

        {/* Border */}
        <div className="absolute inset-2 border-4 border-white/40 rounded-lg" />
      </div>

      {/* Card count badge */}
      {count !== undefined && count > 0 && (
        <div className="absolute top-2 right-2 bg-gray-900/90 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white/50 shadow-lg">
          {count}
        </div>
      )}
    </div>
  );
}
