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
    <div className="flex items-center justify-center gap-8 py-8">
      {/* Draw Pile */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onDrawPileClick}
          className="transform transition hover:scale-105 active:scale-95"
          disabled={!onDrawPileClick}
        >
          <CardBack size="large" count={deckCount} />
        </button>
        <p className="text-gray-400 text-sm font-medium">Draw Pile</p>
        <p className="text-gray-500 text-xs">{deckCount} cards</p>
      </div>

      {/* Direction Indicator */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-600">
          {direction === 1 ? (
            <span className="text-3xl">↻</span>
          ) : (
            <span className="text-3xl">↺</span>
          )}
        </div>
        <p className="text-gray-400 text-xs">
          {direction === 1 ? 'Clockwise' : 'Counter-clockwise'}
        </p>
      </div>

      {/* Discard Pile */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {topCard ? (
            <>
              <Card card={topCard} size="large" />

              {/* Current Color Indicator */}
              {currentColor && (
                <div
                  className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-white text-xs font-bold shadow-lg"
                  style={{ backgroundColor: colorCSS }}
                >
                  {getColorName(currentColor)}
                </div>
              )}
            </>
          ) : (
            <div className="w-40 h-60 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
              <span className="text-gray-600 text-sm">No card</span>
            </div>
          )}
        </div>
        <p className="text-gray-400 text-sm font-medium mt-2">Discard Pile</p>
      </div>

      {/* Penalty Indicator */}
      {pendingPenalty > 0 && (
        <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
          <div className="text-xs font-medium">Pending Draw</div>
          <div className="text-2xl font-bold">+{pendingPenalty}</div>
        </div>
      )}
    </div>
  );
}
