'use client';

import { useParams } from 'next/navigation';
import { useSocket } from '@/lib/socket/SocketContext';
import { formatRoomCode } from '@/lib/utils/roomCode';

export default function GamePage() {
  const params = useParams();
  const { gameState } = useSocket();
  const roomId = params.roomId as string;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-2xl">
          Game Room: {formatRoomCode(roomId)}
        </h1>

        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-gray-700">
          <div className="mb-6">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold text-white mb-2">Game Board Coming Soon!</h2>
            <p className="text-gray-300 mb-6">
              The game has started successfully. The game board UI is being built next.
            </p>
          </div>

          {gameState && (
            <div className="bg-gray-800 rounded-lg p-4 text-left border border-gray-600">
              <h3 className="text-white font-bold mb-2">Game State:</h3>
              <div className="text-gray-300 text-sm space-y-1">
                <p>• Round: {gameState.roundNumber}</p>
                <p>• Players: {gameState.players.length}</p>
                <p>• Cards in deck: {gameState.deckCount}</p>
                <p>• Your hand: {gameState.myHand.length} cards</p>
                <p>• Current color: {gameState.currentColor || 'N/A'}</p>
                <p>
                  • Current turn:{' '}
                  {gameState.players[gameState.currentPlayerIndex]?.name || 'Unknown'}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              All game logic is working server-side. Building the UI next...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
