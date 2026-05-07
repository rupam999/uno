'use client';

import Image from 'next/image';
import { PublicPlayer } from '@/lib/game/types';
import { getAvatarUrl } from '@/lib/utils/avatars';

interface OpponentHandsProps {
  players: PublicPlayer[];
  currentPlayerIndex: number;
  myPlayerId: string;
}

export function OpponentHands({ players, currentPlayerIndex, myPlayerId }: OpponentHandsProps) {
  const opponents = players.filter((p) => p.id !== myPlayerId && !p.isEliminated);
  const currentPlayer = players[currentPlayerIndex];

  if (opponents.length === 0) {
    return null;
  }

  // Calculate circular positions around the play area
  const getCircularPosition = (index: number, total: number) => {
    // Distribute opponents in a circle, leaving bottom area for player
    const totalSlots = total + 1; // +1 to account for player at bottom
    const angleStep = (2 * Math.PI) / totalSlots;

    // Start from top-left and go around, skipping the bottom position
    const startAngle = -Math.PI * 0.75; // Start at top-left
    const angle = startAngle + angleStep * index;

    // Position on edges of screen
    const radiusX = 45; // Horizontal radius percentage
    const radiusY = 42; // Vertical radius percentage

    const x = 50 + radiusX * Math.cos(angle);
    const y = 50 + radiusY * Math.sin(angle);

    return { x, y };
  };

  return (
    <>
      {opponents.map((opponent, index) => {
        const isCurrentTurn = opponent.id === currentPlayer?.id;
        const { x, y } = getCircularPosition(index, opponents.length);

        return (
          <div
            key={opponent.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
          >
            {/* Player Avatar with Card Count */}
            <div className="relative">
              {/* Glow effect when it's their turn */}
              {isCurrentTurn && (
                <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-60 animate-pulse scale-150"></div>
              )}

              {/* Avatar Circle */}
              <div
                className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 transition-all duration-300 shadow-xl overflow-hidden ${
                  isCurrentTurn
                    ? 'border-green-400 shadow-green-400/50 scale-110'
                    : 'border-white/40'
                }`}
              >
                {/* Avatar from individual image */}
                <Image
                  src={getAvatarUrl(opponent.id)}
                  alt={opponent.name}
                  fill
                  className="object-cover"
                />

                {/* Connection status indicator */}
                {!opponent.isConnected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
                )}

                {/* Turn indicator */}
                {isCurrentTurn && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-400 text-xs font-black px-2 py-0.5 rounded-full text-white shadow-lg whitespace-nowrap">
                    PLAYING
                  </div>
                )}
              </div>

              {/* Card stack behind avatar */}
              <div className="absolute -right-8 top-1/2 -translate-y-1/2 -z-10">
                <div className="flex -space-x-2">
                  {[...Array(Math.min(opponent.cardCount, 3))].map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-12 md:w-10 md:h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded border-2 border-white/20 shadow-lg transform -rotate-12"
                      style={{ transform: `rotate(${-10 + i * 5}deg) translateX(${i * 2}px)` }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <span className="text-white text-xs font-bold">UNO</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card count badge */}
              <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg px-3 py-1.5 border-2 border-white/50 shadow-lg min-w-[3rem] text-center">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  <span className="text-white font-black text-base">{opponent.cardCount}</span>
                </div>
              </div>

              {/* Player name label */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg">
                <span className="text-white text-sm font-bold">{opponent.name}</span>
              </div>

              {/* UNO indicator */}
              {opponent.calledUno && opponent.cardCount === 1 && (
                <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-black px-3 py-1 rounded-full animate-bounce shadow-xl z-10">
                  UNO!
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
