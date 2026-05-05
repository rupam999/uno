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

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-4 justify-center">
        {opponents.map((opponent) => {
          const isCurrentTurn = opponent.id === currentPlayer?.id;

          return (
            <div
              key={opponent.id}
              className={`
                bg-gray-800/50 rounded-xl p-4 border-2 transition-all
                ${isCurrentTurn ? 'border-green-400 shadow-lg shadow-green-400/20' : 'border-gray-700'}
                ${!opponent.isConnected ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {opponent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{opponent.name}</p>
                    {isCurrentTurn && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-xs font-medium">Playing</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">{opponent.cardCount} cards</p>
                </div>
              </div>

              {/* Card Back Display */}
              <div className="flex justify-center">
                <div className="relative">
                  <CardBack size="small" count={opponent.cardCount} />

                  {opponent.calledUno && opponent.cardCount === 1 && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                      UNO!
                    </div>
                  )}
                </div>
              </div>

              {/* Status Indicators */}
              <div className="mt-2 flex gap-2 justify-center">
                {!opponent.isConnected && (
                  <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded border border-yellow-600">
                    Disconnected
                  </span>
                )}
                {opponent.isHost && (
                  <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-600">
                    Host
                  </span>
                )}
              </div>

              {/* Score */}
              <div className="mt-2 text-center">
                <p className="text-gray-500 text-xs">Score: {opponent.score}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
