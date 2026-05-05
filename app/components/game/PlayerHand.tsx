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
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold">Your Hand</h3>
            <span className="text-gray-400 text-sm">({cards.length} cards)</span>
          </div>

          {isMyTurn && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Your Turn</span>
            </div>
          )}
        </div>

        {/* Cards Grid */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4 overflow-x-auto pb-2">
          {sortedCards.map((card) => {
            const isPlayable =
              isMyTurn &&
              topCard &&
              canPlayCard(card, topCard, currentColor as any, pendingPenalty);

            return (
              <Card
                key={card.id}
                card={card}
                size="medium"
                selected={selectedCardId === card.id}
                playable={isPlayable}
                onClick={() => handleCardClick(card)}
              />
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {selectedCardId && (
            <button
              onClick={handlePlaySelected}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition hover:scale-105"
            >
              Play Selected Card
            </button>
          )}

          {isMyTurn && !hasPlayableCard && !selectedCardId && (
            <button
              onClick={onDrawCard}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition hover:scale-105"
            >
              {pendingPenalty > 0 ? `Draw ${pendingPenalty} Cards` : 'Draw Card'}
            </button>
          )}

          {shouldCallUno && (
            <button
              onClick={onCallUno}
              className="bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition hover:scale-105 animate-pulse"
            >
              UNO! 🎉
            </button>
          )}

          {!isMyTurn && (
            <div className="flex-1 bg-gray-700/50 text-gray-400 font-medium py-3 px-6 rounded-lg text-center border border-gray-600">
              Waiting for other player...
            </div>
          )}
        </div>

        {/* Hint Text */}
        {isMyTurn && hasPlayableCard && (
          <p className="text-gray-400 text-xs text-center mt-2">
            Click a highlighted card to select it, click again to play
          </p>
        )}
      </div>
    </div>
  );
}
