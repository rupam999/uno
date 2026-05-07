'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  const [enableAlliances, setEnableAlliances] = useState(false);
  const [maxAllianceSize, setMaxAllianceSize] = useState(2);

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
      const response = await createRoom(playerName.trim(), enableAlliances, maxAllianceSize);

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Space Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/space-background.jpeg)',
        }}
      >
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-purple-900/30 to-black/60"></div>
      </div>

      <div className="relative w-full max-w-2xl">
        {/* UNO Logo */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex justify-center mb-4 md:mb-6">
            <Image
              src="/assets/logo.png"
              alt="UNO"
              width={160}
              height={160}
              className="drop-shadow-2xl md:w-[220px]"
              priority
            />
          </div>
          <p className="text-xl md:text-3xl text-purple-300 font-bold drop-shadow-lg tracking-wide">
            by Alliance
          </p>
        </div>

        {!isConnected && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-2 md:p-3 mb-3 md:mb-4 text-center backdrop-blur-sm">
            <p className="text-yellow-200 text-xs md:text-sm font-medium">Connecting to server...</p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-gray-900/70 backdrop-blur-xl rounded-3xl p-4 md:p-8 shadow-2xl border border-white/10">
          <div className="mb-4 md:mb-6">
            <label htmlFor="playerName" className="block text-gray-200 mb-2 md:mb-3 text-sm md:text-base font-medium">
              Your Name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-4 md:px-5 py-3 md:py-4 bg-gray-800/80 border border-gray-600/50 rounded-xl text-white text-base md:text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
              disabled={creatingRoom || joiningRoom}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !showJoinForm) {
                  handleCreateRoom();
                }
              }}
            />
          </div>

          {/* Alliance Settings Toggle - Only show when creating room */}
          {!showJoinForm && (
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
              <div className="flex items-center justify-between">
                <label className="text-gray-200 text-sm md:text-base font-medium">Enable Alliances</label>
                <button
                  onClick={() => setEnableAlliances(!enableAlliances)}
                  className={`relative w-11 h-6 md:w-12 md:h-6 rounded-full transition-colors ${
                    enableAlliances ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      enableAlliances ? 'transform translate-x-5 md:translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              {enableAlliances && (
                <div>
                  <label className="text-gray-300 text-xs md:text-sm mb-1 md:mb-2 mt-2 block">
                    Max Players per Alliance: {maxAllianceSize}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="5"
                    value={maxAllianceSize}
                    onChange={(e) => setMaxAllianceSize(Number(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-3 md:mb-4 bg-red-500/20 border border-red-500/50 rounded-xl p-2 md:p-3 backdrop-blur-sm">
              <p className="text-red-200 text-xs md:text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {!showJoinForm ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <button
                onClick={handleCreateRoom}
                disabled={creatingRoom || !isConnected}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-5 md:py-6 px-4 md:px-6 rounded-2xl shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-row items-center gap-3 md:gap-4"
              >
                <div className="bg-white/20 rounded-full p-2.5 md:p-3">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-base md:text-lg font-black">CREATE ROOM</div>
                  <div className="text-xs md:text-sm text-purple-200 font-normal">Play with friends</div>
                </div>
              </button>

              <button
                onClick={() => setShowJoinForm(true)}
                disabled={!isConnected}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-5 md:py-6 px-4 md:px-6 rounded-2xl shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-row items-center gap-3 md:gap-4"
              >
                <div className="bg-white/20 rounded-full p-2.5 md:p-3">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-base md:text-lg font-black">JOIN ROOM</div>
                  <div className="text-xs md:text-sm text-blue-200 font-normal">Enter room code</div>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="roomCode" className="block text-gray-200 mb-3 text-base font-medium">
                  Room Code
                </label>
                <input
                  id="roomCode"
                  type="text"
                  value={formatRoomCode(roomCode)}
                  onChange={handleRoomCodeChange}
                  placeholder="ABC123"
                  maxLength={7}
                  className="w-full px-5 py-4 bg-gray-800/80 border border-gray-600/50 rounded-xl text-white text-center text-2xl font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase tracking-widest backdrop-blur-sm"
                  disabled={joiningRoom}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && roomCode.length === 6) {
                      handleJoinRoom();
                    }
                  }}
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
                  className="flex-1 bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 font-medium py-4 px-4 rounded-xl border border-gray-600/50 transition backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={joiningRoom || !isConnected || roomCode.length !== 6}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-4 rounded-xl shadow-xl transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {joiningRoom ? 'Joining...' : 'Join'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-700/50">
            <p className="text-gray-400 text-xs md:text-sm text-center">
              168 cards • Draw stacking • Mercy rule at 25 cards
            </p>
          </div>
        </div>

        <p className="text-gray-400 text-center mt-4 md:mt-6 text-xs md:text-sm">
          UNO by Alliance • 2-10 players
        </p>
      </div>
    </div>
  );
}
