'use client';

import { useParams } from 'next/navigation';
import { useSocket } from '@/lib/socket/SocketContext';
import { GameBoard } from '@/app/components/game/GameBoard';

export default function GamePage() {
  const params = useParams();
  const { gameState } = useSocket();
  const roomId = params.roomId as string;

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
        <div className="text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Game...</h2>
          <p className="text-gray-300">Please wait while we set up the game board</p>
        </div>
      </div>
    );
  }

  return <GameBoard initialGameState={gameState} roomId={roomId} />;
}
