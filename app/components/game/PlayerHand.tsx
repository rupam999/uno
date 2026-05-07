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
  const [autoUno, setAutoUno] = useState(false);

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

  // Calculate positioning for cards - slight arc but mostly horizontal
  const getCardPosition = (index: number, total: number) => {
    const maxAngle = Math.min(15, total * 1.5); // Very subtle arc
    const angleStep = total > 1 ? maxAngle / (total - 1) : 0;
    const startAngle = -maxAngle / 2;
    const angle = startAngle + angleStep * index;

    // Horizontal spacing
    const cardWidth = 130; // Account for card width + overlap
    const totalWidth = (total - 1) * cardWidth * 0.4; // Cards overlap by 60%
    const x = -totalWidth / 2 + index * cardWidth * 0.4;

    // Very slight vertical curve
    const y = Math.abs(angle) * 2;

    return { x, y, angle };
  };

  return (
    <div className="relative w-full h-full">
      {/* Action Buttons - Top Right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Auto UNO Toggle */}
        <button
          onClick={() => setAutoUno(!autoUno)}
          className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 flex items-center gap-2"
        >
          <span className="text-white text-sm font-bold">Auto UNO</span>
          <div
            className={`w-10 h-6 rounded-full transition-colors ${
              autoUno ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${
                autoUno ? 'ml-5' : 'ml-1'
              }`}
            ></div>
          </div>
        </button>

        {/* UNO Button */}
        {shouldCallUno && (
          <button
            onClick={onCallUno}
            className="bg-gradient-to-r from-red-500 via-pink-500 to-red-600 hover:from-red-600 hover:via-pink-600 hover:to-red-700 text-white font-black text-lg px-8 py-4 rounded-2xl shadow-2xl shadow-red-500/50 animate-pulse transform hover:scale-105 transition-all"
          >
            UNO!
          </button>
        )}

        {/* Play Selected Button */}
        {selectedCardId && (
          <button
            onClick={handlePlaySelected}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-lg px-8 py-4 rounded-2xl shadow-2xl shadow-green-500/50 transform hover:scale-105 transition-all"
          >
            ▶ PLAY
          </button>
        )}

        {/* Draw Button */}
        {isMyTurn && !hasPlayableCard && !selectedCardId && (
          <button
            onClick={onDrawCard}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-lg px-8 py-4 rounded-2xl shadow-2xl shadow-blue-500/50 transform hover:scale-105 transition-all"
          >
            {pendingPenalty > 0 ? `↓ DRAW +${pendingPenalty}` : '↓ DRAW CARD'}
          </button>
        )}
      </div>

      {/* Cards at Bottom - Horizontal Line */}
      <div className="absolute bottom-0 left-0 right-0 pb-4">
        <div className="relative h-44 md:h-52">
          {/* PLAY Button - Shows when card is selected */}
          {selectedCardId && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 z-40">
              <button
                onClick={handlePlaySelected}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-2xl px-12 py-5 rounded-2xl shadow-2xl shadow-green-500/50 transform hover:scale-110 transition-all animate-bounce"
              >
                ▶ PLAY
              </button>
            </div>
          )}

          {sortedCards.map((card, index) => {
            const { x, y, angle } = getCardPosition(index, sortedCards.length);
            const isPlayable =
              isMyTurn &&
              topCard &&
              canPlayCard(card, topCard, currentColor as any, pendingPenalty);

            return (
              <div
                key={card.id}
                className="absolute left-1/2 bottom-0 transform -translate-x-1/2 transition-all duration-300"
                style={{
                  transform: `translateX(calc(-50% + ${x}px)) translateY(-${y}px) rotate(${angle}deg) ${
                    selectedCardId === card.id ? 'translateY(-50px) scale(1.1)' : ''
                  } ${isPlayable && isMyTurn ? 'translateY(-20px)' : ''}`,
                  zIndex: selectedCardId === card.id ? 30 : 10 + index,
                }}
              >
                <div
                  onClick={() => handleCardClick(card)}
                  className={`cursor-pointer transition-transform ${
                    isPlayable && isMyTurn ? 'hover:scale-105 hover:-translate-y-2' : ''
                  }`}
                >
                  <Card
                    card={card}
                    size="medium"
                    selected={selectedCardId === card.id}
                    playable={!!isPlayable}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
