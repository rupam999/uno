'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateRoom, useJoinRoom, useSocket } from '@/lib/socket/SocketContext';
import { unformatRoomCode, formatRoomCode } from '@/lib/utils/roomCode';

export default function HomePage() {
  const router = useRouter();
  const { isConnected } = useSocket();
  const { createRoom, loading: creatingRoom } = useCreateRoom();
  const { joinRoom, loading: joiningRoom } = useJoinRoom();

  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (playerName.trim().length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }

    try {
      setError('');
      const response = await createRoom(playerName.trim());

      if (response.success && response.roomId) {
        router.push(`/lobby/${response.roomId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    const cleanedCode = unformatRoomCode(roomCode);

    if (cleanedCode.length !== 6) {
      setError('Invalid room code');
      return;
    }

    try {
      setError('');
      const response = await joinRoom(cleanedCode, playerName.trim());

      if (response.success && response.gameState) {
        if (response.gameState.state === 'waiting') {
          router.push(`/lobby/${cleanedCode}`);
        } else {
          router.push(`/game/${cleanedCode}`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
    }
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value.slice(0, 6));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2 drop-shadow-2xl">
            UNO
          </h1>
          <p className="text-xl text-purple-400 font-semibold drop-shadow-lg">by Alliance</p>
          <p className="text-sm text-gray-300 mt-2">
            Multiplayer Card Game
          </p>
        </div>

        {!isConnected && (
          <div className="bg-yellow-900/40 border border-yellow-600 rounded-lg p-3 mb-4 text-center">
            <p className="text-yellow-300 text-sm font-medium">Connecting to server...</p>
          </div>
        )}

        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-700">
          <div className="mb-6">
            <label htmlFor="playerName" className="block text-gray-200 mb-2 text-sm font-medium">
              Your Name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={creatingRoom || joiningRoom}
            />
          </div>

          {error && (
            <div className="mb-4 bg-red-900/50 border border-red-600 rounded-lg p-3">
              <p className="text-red-200 text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {!showJoinForm ? (
            <div className="space-y-3">
              <button
                onClick={handleCreateRoom}
                disabled={creatingRoom || !isConnected}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {creatingRoom ? 'Creating...' : 'Create New Game'}
              </button>

              <button
                onClick={() => setShowJoinForm(true)}
                disabled={!isConnected}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Join Existing Game
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="roomCode" className="block text-gray-200 mb-2 text-sm font-medium">
                  Room Code
                </label>
                <input
                  id="roomCode"
                  type="text"
                  value={formatRoomCode(roomCode)}
                  onChange={handleRoomCodeChange}
                  placeholder="ABC123"
                  maxLength={7}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-center text-2xl font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase tracking-wider"
                  disabled={joiningRoom}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowJoinForm(false);
                    setRoomCode('');
                    setError('');
                  }}
                  disabled={joiningRoom}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium py-3 px-4 rounded-lg border border-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={joiningRoom || !isConnected || roomCode.length !== 6}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {joiningRoom ? 'Joining...' : 'Join'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-xs text-center">
              168 cards • Draw stacking • Mercy rule at 25 cards
            </p>
          </div>
        </div>

        <p className="text-gray-500 text-center mt-6 text-sm">
          UNO by Alliance • 2-10 players
        </p>
      </div>
    </div>
  );
}
