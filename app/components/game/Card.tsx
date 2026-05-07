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
        relative rounded-xl overflow-hidden transition-all duration-300
        ${selected ? 'ring-4 ring-blue-400 -translate-y-4 shadow-2xl shadow-blue-500/50 scale-105' : 'shadow-xl'}
        ${playable ? 'hover:scale-110 hover:-translate-y-3 cursor-pointer ring-2 ring-green-400/50' : ''}
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

      {/* Playable glow effect */}
      {playable && !selected && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/40 via-emerald-400/30 to-green-500/40 rounded-xl ring-2 ring-green-400 animate-pulse" />
      )}

      {/* Selected indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-xl ring-2 ring-white z-10 animate-bounce">
          <span className="text-white text-sm font-black">✓</span>
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
      {/* UNO Logo as card back */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-yellow-500 to-blue-600 rounded-xl">
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <Image
            src="/assets/logo.png"
            alt="UNO"
            width={width * 0.7}
            height={height * 0.7}
            className="object-contain drop-shadow-2xl"
          />
        </div>

        {/* Border decoration */}
        <div className="absolute inset-2 border-4 border-white/30 rounded-lg"></div>
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
