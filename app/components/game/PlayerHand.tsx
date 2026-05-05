'use client';

import { useState } from 'react';
import { Card as CardType } from '@/lib/game/types';
import { Card } from './Card';
import { canPlayCard } from '@/server/game/validators';

interface PlayerHandProps {
  cards: CardType[];
  topCard: CardType | null;
  currentColor: string | null;
  pendingPenalty: number;
  isMyTurn: boolean;
  onCardSelect: (cardId: string) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
}

export function PlayerHand({
  cards,
  topCard,
  currentColor,
  pendingPenalty,
  isMyTurn,
  onCardSelect,
  onDrawCard,
  onCallUno,
}: PlayerHandProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const handleCardClick = (card: CardType) => {
    if (!isMyTurn) return;

    const isPlayable =
      topCard && canPlayCard(card, topCard, currentColor as any, pendingPenalty);

    if (isPlayable) {
      if (selectedCardId === card.id) {
        // Double click to play
        onCardSelect(card.id);
        setSelectedCardId(null);
      } else {
        // First click to select
        setSelectedCardId(card.id);
      }
    }
  };

  const handlePlaySelected = () => {
    if (selectedCardId) {
      onCardSelect(selectedCardId);
      setSelectedCardId(null);
    }
  };

  // Sort cards by color and value
  const sortedCards = [...cards].sort((a, b) => {
    const colorOrder: any = { red: 0, blue: 1, green: 2, yellow: 3, null: 4 };
    const colorA = colorOrder[a.color || 'null'] || 4;
    const colorB = colorOrder[b.color || 'null'] || 4;

    if (colorA !== colorB) return colorA - colorB;

    if (a.type === 'number' && b.type === 'number') {
      return (a.value || 0) - (b.value || 0);
    }

    return a.type.localeCompare(b.type);
  });

  const hasPlayableCard =
    isMyTurn &&
    topCard &&
    sortedCards.some((card) =>
      canPlayCard(card, topCard, currentColor as any, pendingPenalty)
    );

  const shouldCallUno = cards.length === 2;

  return (
    <div className="w-full">
      {/* Cards Display */}
      <div className="bg-gradient-to-t from-black/80 to-black/40 rounded-xl md:rounded-2xl p-1.5 md:p-3 border border-purple-500/30 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <h3 className="text-white font-black text-[11px] md:text-sm tracking-wide">
            HAND <span className="text-purple-300">({cards.length})</span>
          </h3>

          {isMyTurn && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/40">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="text-green-400 text-[10px] md:text-xs font-bold tracking-wide">YOUR TURN</span>
            </div>
          )}
        </div>

        {/* Cards Grid - Horizontal scroll on mobile */}
        <div className="flex gap-1.5 md:gap-2 mb-1.5 md:mb-3 overflow-x-auto pb-1 md:pb-2 scrollbar-hide">
          {sortedCards.map((card) => {
            const isPlayable =
              isMyTurn &&
              topCard &&
              canPlayCard(card, topCard, currentColor as any, pendingPenalty);

            return (
              <div key={card.id} className="flex-shrink-0 transform transition-transform hover:scale-105">
                <Card
                  card={card}
                  size="small"
                  selected={selectedCardId === card.id}
                  playable={!!isPlayable}
                  onClick={() => handleCardClick(card)}
                />
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 md:gap-2">
          {selectedCardId && (
            <button
              onClick={handlePlaySelected}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-1.5 md:py-2.5 px-3 md:px-5 rounded-lg shadow-lg hover:shadow-green-500/50 transition-all duration-200 text-[11px] md:text-sm tracking-wider"
            >
              ▶ PLAY
            </button>
          )}

          {isMyTurn && !hasPlayableCard && !selectedCardId && (
            <button
              onClick={onDrawCard}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black py-1.5 md:py-2.5 px-3 md:px-5 rounded-lg shadow-lg hover:shadow-blue-500/50 transition-all duration-200 text-[11px] md:text-sm tracking-wider"
            >
              {pendingPenalty > 0 ? `↓ +${pendingPenalty}` : '↓ DRAW'}
            </button>
          )}

          {shouldCallUno && (
            <button
              onClick={onCallUno}
              className="bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white font-black py-1.5 md:py-2.5 px-3 md:px-5 rounded-lg shadow-lg shadow-red-500/50 animate-pulse transition-all duration-200 text-[11px] md:text-sm tracking-widest"
            >
              🎯 UNO!
            </button>
          )}

          {!isMyTurn && (
            <div className="flex-1 bg-gray-800/50 text-gray-400 font-bold py-1.5 md:py-2.5 px-3 md:px-5 rounded-lg text-center border border-gray-700/50 text-[10px] md:text-sm tracking-wide">
              ⏳ Waiting...
            </div>
          )}
        </div>

        {/* Hint Text */}
        {isMyTurn && hasPlayableCard && (
          <p className="text-purple-300/60 text-xs text-center mt-1 md:mt-2 hidden md:block font-medium">
            Tap card twice to play
          </p>
        )}
      </div>
    </div>
  );
}
