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
  canPassTurn?: boolean;
  onPassTurn?: () => void;
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
  canPassTurn = false,
  onPassTurn,
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

    // Horizontal spacing - responsive based on screen size
    const cardWidth = 130; // Account for card width + overlap (base mobile)
    const totalWidth = (total - 1) * cardWidth * 0.4; // Cards overlap by 60%
    const x = -totalWidth / 2 + index * cardWidth * 0.4;

    // Very slight vertical curve
    const y = Math.abs(angle) * 2;

    return { x, y, angle };
  };

  return (
    <div className="relative w-full h-full">
      {/* Action Buttons - Bottom Center, fixed to viewport */}
      <div className="fixed bottom-32 md:bottom-56 left-1/2 -translate-x-1/2 z-30 flex flex-col md:flex-row items-center gap-2">
        {/* Play Selected Button */}
        {selectedCardId && (
          <button
            onClick={handlePlaySelected}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black text-sm md:text-lg px-6 md:px-10 py-2.5 md:py-4 rounded-xl md:rounded-2xl shadow-2xl shadow-green-500/50 transform hover:scale-105 transition-all"
          >
            ▶ PLAY CARD
          </button>
        )}

        {/* Pass Turn Button - Shows after drawing a playable card */}
        {canPassTurn && isMyTurn && !selectedCardId && onPassTurn && (
          <button
            onClick={onPassTurn}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-black text-sm md:text-lg px-6 md:px-10 py-2.5 md:py-4 rounded-xl md:rounded-2xl shadow-2xl shadow-purple-500/50 transform hover:scale-105 transition-all"
          >
            ⏩ PASS TURN
          </button>
        )}

        {/* Draw Button */}
        {isMyTurn && !hasPlayableCard && !selectedCardId && !canPassTurn && (
          <button
            onClick={onDrawCard}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm md:text-lg px-6 md:px-10 py-2.5 md:py-4 rounded-xl md:rounded-2xl shadow-2xl shadow-blue-500/50 transform hover:scale-105 transition-all"
          >
            {pendingPenalty > 0 ? `↓ DRAW +${pendingPenalty}` : '↓ DRAW CARD'}
          </button>
        )}
      </div>

      {/* Cards at Bottom - Scrollable on mobile */}
<div className="absolute bottom-0 left-0 right-0 pb-2 md:pb-4 flex justify-center">
        <div className="overflow-x-auto overflow-y-visible scrollbar-hide px-2 max-w-full">
          <div className="relative h-36 md:h-52 flex items-end justify-center gap-1" style={{ minWidth: 'min-content' }}>
            {sortedCards.map((card, index) => {
              const { y, angle } = getCardPosition(index, sortedCards.length);
              const isPlayable =
                isMyTurn &&
                topCard &&
                canPlayCard(card, topCard, currentColor as any, pendingPenalty);

              return (
                <div
                  key={card.id}
                  className="transition-all duration-300 shrink-0 -ml-10 first:ml-0 lg:-ml-12 xl:-ml-14"
                  style={{
                    transform: `translateY(-${y}px) rotate(${angle}deg) ${
                      selectedCardId === card.id ? 'translateY(-30px) scale(1.1)' : ''
                    } ${isPlayable && isMyTurn ? 'translateY(-15px)' : ''}`,
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
                      size="small"
                      selected={selectedCardId === card.id}
                      playable={!!isPlayable}
                      responsive={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
