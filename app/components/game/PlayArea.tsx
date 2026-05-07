'use client';

import { Card as CardType, Color } from '@/lib/game/types';
import { Card } from './Card';
import { getColorCSS, getColorName } from '@/lib/utils/cardSprites';

interface PlayAreaProps {
  topCard: CardType | null;
  currentColor: Color | null;
  pendingPenalty: number;
  direction: 1 | -1;
}

export function PlayArea({
  topCard,
  currentColor,
  pendingPenalty,
  direction,
}: PlayAreaProps) {
  const colorCSS = getColorCSS(currentColor);

  return (
    <div className="relative">
      {/* Direction indicator badge */}
      <div className="absolute -top-16 right-0 z-20">
        <div className="bg-black/70 backdrop-blur-md rounded-full p-2 border-2 border-white/30 shadow-lg">
          {direction === 1 ? (
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20" style={{ transform: 'scaleX(-1)' }}>
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* Penalty Indicator */}
      {pendingPenalty > 0 && (
        <div className="absolute -top-16 left-0 z-20">
          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-full px-4 py-2 border-2 border-white/50 shadow-2xl animate-bounce">
            <div className="text-white font-black text-2xl">+{pendingPenalty}</div>
          </div>
        </div>
      )}

      {/* Discard Pile - Center */}
      <div className="relative">
        {topCard ? (
          <div className="relative">
            {/* Card glow effect */}
            <div
              className="absolute inset-0 rounded-xl blur-xl opacity-50"
              style={{ backgroundColor: colorCSS }}
            ></div>

            {/* Card */}
            <div className="relative transform hover:scale-105 transition-all duration-300">
              <Card card={topCard} size="large" />
            </div>

            {/* Current Color Indicator */}
            {currentColor && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                <div
                  className="px-4 py-2 rounded-full text-white text-sm font-black shadow-xl ring-2 ring-white/50 tracking-wider uppercase"
                  style={{ backgroundColor: colorCSS }}
                >
                  {getColorName(currentColor)}
                </div>
              </div>
            )}

            {/* Discard label */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold whitespace-nowrap opacity-70">
              DISCARD
            </div>
          </div>
        ) : (
          <div className="w-40 h-60 bg-gray-900/40 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white/40 text-sm font-bold">EMPTY</span>
          </div>
        )}
      </div>
    </div>
  );
}
