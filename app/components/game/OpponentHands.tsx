'use client';

import { PublicPlayer } from '@/lib/game/types';
import { CardBack } from './Card';

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

  // Position players around the table
  const getPlayerPosition = (index: number, total: number) => {
    if (total === 1) return 'top-center';
    if (total === 2) return index === 0 ? 'top-left' : 'top-right';
    if (total === 3) return index === 0 ? 'top-left' : index === 1 ? 'top-center' : 'top-right';

    // For 4+ players, spread them around
    const positions = ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left'];
    return positions[index] || 'top-center';
  };

  return (
    <>
      {opponents.map((opponent, index) => {
        const isCurrentTurn = opponent.id === currentPlayer?.id;
        const position = getPlayerPosition(index, opponents.length);

        return (
          <div
            key={opponent.id}
            className={`absolute ${getPositionStyles(position)} transform -translate-x-1/2`}
          >
            <div
              className={`
                bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-xl md:rounded-2xl p-2.5 md:p-3 border-2 transition-all duration-300
                ${isCurrentTurn ? 'border-green-400 shadow-xl shadow-green-400/50 scale-105 ring-2 ring-green-400/30' : 'border-purple-500/30'}
                ${!opponent.isConnected ? 'opacity-50' : ''}
                min-w-[100px] md:min-w-[140px]
              `}
            >
              {/* Player Info */}
              <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                <div className="w-7 h-7 md:w-9 md:h-9 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center text-white font-black shadow-lg text-xs md:text-sm ring-2 ring-purple-400/50">
                  {opponent.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-white font-bold text-xs md:text-sm truncate">{opponent.name}</p>
                    {isCurrentTurn && (
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    )}
                  </div>
                  <p className="text-purple-300 text-[10px] md:text-xs font-semibold">{opponent.cardCount} cards</p>
                </div>
              </div>

              {/* Card Display */}
              <div className="flex justify-center mb-1.5 md:mb-2">
                <div className="relative scale-90 md:scale-100 transform transition-transform hover:scale-95">
                  <CardBack size="small" count={opponent.cardCount} />

                  {opponent.calledUno && opponent.cardCount === 1 && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-black px-2.5 py-1 rounded-full animate-bounce shadow-xl ring-2 ring-red-400">
                      UNO!
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex gap-1 justify-center flex-wrap">
                {!opponent.isConnected && (
                  <span className="text-[9px] md:text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-400/40 font-bold">
                    Away
                  </span>
                )}
                {opponent.isHost && (
                  <span className="text-[9px] md:text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/40 font-bold">
                    Host
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function getPositionStyles(position: string): string {
  const styles: Record<string, string> = {
    'top-left': 'top-8 md:top-12 left-8 md:left-12',
    'top-center': 'top-8 md:top-12 left-1/2',
    'top-right': 'top-8 md:top-12 right-8 md:right-12 translate-x-1/2',
    'middle-left': 'top-1/2 left-8 md:left-12 -translate-y-1/2 translate-x-0',
    'middle-right': 'top-1/2 right-8 md:right-12 -translate-y-1/2 translate-x-0',
  };
  return styles[position] || styles['top-center'];
}
