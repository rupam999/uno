'use client';

import Image from 'next/image';
import { Card as CardType } from '@/lib/game/types';
import { getCardImagePath } from '@/lib/utils/cardSprites';

interface CardProps {
  card: CardType;
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  playable?: boolean;
  onClick?: () => void;
  className?: string;
}

const SIZE_CONFIG = {
  small: { width: 80, height: 120 },
  medium: { width: 120, height: 180 },
  large: { width: 160, height: 240 },
};

export function Card({
  card,
  size = 'medium',
  selected = false,
  playable = false,
  onClick,
  className = '',
}: CardProps) {
  const { width, height } = SIZE_CONFIG[size];
  const imagePath = getCardImagePath(card);

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
      {/* Card Image */}
      <div className="absolute inset-0">
        <Image
          src={imagePath}
          alt={`Card`}
          fill
          className="object-cover rounded-xl"
          sizes={`${width}px`}
          priority={size === 'large'}
        />
      </div>

      {/* Playable indicator */}
      {playable && !selected && (
        <div className="absolute inset-0 bg-green-400/30 rounded-xl ring-2 ring-green-400 animate-pulse" />
      )}

      {/* Selected indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white z-10">
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
      {/* Use the UNO logo as card back */}
      <div className="absolute inset-0">
        <Image
          src="/cards/logo.png"
          alt="Card back"
          fill
          className="object-cover rounded-xl"
          sizes={`${width}px`}
        />
      </div>

      {/* Card count badge */}
      {count !== undefined && count > 0 && (
        <div className="absolute top-2 right-2 bg-gray-900/90 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white/50 shadow-lg z-10">
          {count}
        </div>
      )}
    </div>
  );
}
