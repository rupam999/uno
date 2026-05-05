'use client';

import { Card as CardType, Color } from '@/lib/game/types';
import { Card, CardBack } from './Card';
import { getColorCSS, getColorName } from '@/lib/utils/cardSprites';

interface PlayAreaProps {
  topCard: CardType | null;
  currentColor: Color | null;
  deckCount: number;
  pendingPenalty: number;
  direction: 1 | -1;
  onDrawPileClick?: () => void;
}

export function PlayArea({
  topCard,
  currentColor,
  deckCount,
  pendingPenalty,
  direction,
  onDrawPileClick,
}: PlayAreaProps) {
  const colorCSS = getColorCSS(currentColor);

  return (
    <div className="flex items-center justify-center gap-4 md:gap-8 py-4 md:py-8">
      {/* Draw Pile */}
      <div className="flex flex-col items-center gap-1.5 md:gap-2">
        <button
          onClick={onDrawPileClick}
          className={`transform transition-all duration-300 ${onDrawPileClick ? 'hover:scale-110 hover:-translate-y-1 cursor-pointer active:scale-95 shadow-xl hover:shadow-2xl hover:shadow-blue-500/50' : 'cursor-default opacity-90'} rounded-xl`}
          disabled={!onDrawPileClick}
        >
          <div className="relative">
            <CardBack size="medium" count={deckCount} />
            {onDrawPileClick && (
              <div className="absolute inset-0 rounded-xl ring-2 ring-blue-400/50 animate-pulse"></div>
            )}
          </div>
        </button>
        <div className="bg-gray-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-purple-500/30">
          <p className="text-purple-200 text-xs md:text-sm font-bold tracking-wide">{deckCount}</p>
        </div>
      </div>

      {/* Direction Indicator */}
      <div className="flex flex-col items-center gap-1.5 md:gap-2">
        <div className="w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center border-4 border-purple-500/40 shadow-xl">
          {direction === 1 ? (
            <span className="text-2xl md:text-4xl animate-spin-slow">↻</span>
          ) : (
            <span className="text-2xl md:text-4xl animate-spin-slow-reverse">↺</span>
          )}
        </div>
        <p className="text-purple-300 text-[10px] md:text-xs font-bold tracking-wide hidden md:block">
          {direction === 1 ? 'CLOCKWISE' : 'COUNTER'}
        </p>
      </div>

      {/* Discard Pile */}
      <div className="flex flex-col items-center gap-1.5 md:gap-2">
        <div className="relative">
          {topCard ? (
            <>
              <div className="transform transition-all duration-300 hover:scale-105 shadow-2xl rounded-xl">
                <Card card={topCard} size="medium" />
              </div>

              {/* Current Color Indicator */}
              {currentColor && (
                <div
                  className="absolute -bottom-2 md:-bottom-3 left-1/2 transform -translate-x-1/2 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-white text-xs font-black shadow-xl ring-2 ring-white/50 tracking-wider"
                  style={{ backgroundColor: colorCSS }}
                >
                  {getColorName(currentColor).toUpperCase()}
                </div>
              )}
            </>
          ) : (
            <div className="w-24 h-36 md:w-40 md:h-60 bg-gray-900/80 rounded-xl border-2 border-dashed border-purple-500/40 flex items-center justify-center backdrop-blur-sm">
              <span className="text-purple-400 text-xs md:text-sm font-bold">EMPTY</span>
            </div>
          )}
        </div>
        <div className="bg-gray-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-purple-500/30">
          <p className="text-purple-200 text-xs md:text-sm font-bold tracking-wide">DISCARD</p>
        </div>
      </div>

      {/* Penalty Indicator */}
      {pendingPenalty > 0 && (
        <div className="absolute top-4 md:top-6 right-4 md:right-6 bg-gradient-to-br from-red-500 via-pink-500 to-red-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-2xl shadow-2xl animate-bounce border-2 border-red-300/50 ring-2 ring-red-500/30">
          <div className="text-[10px] md:text-xs font-black tracking-wider">PENALTY</div>
          <div className="text-2xl md:text-4xl font-black">+{pendingPenalty}</div>
        </div>
      )}
    </div>
  );
}
