'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSocket, useSocketEvent, useStartGame, useCreateAlliance, useJoinAlliance, useLeaveAlliance } from '@/lib/socket/SocketContext';
import { formatRoomCode } from '@/lib/utils/roomCode';
import { PlayerJoinedPayload, PlayerLeftPayload, GameStartedPayload, ClientGameState } from '@/lib/game/types';
import { SERVER_EVENTS } from '@/lib/socket/events';

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { socket, gameState, setGameState } = useSocket();
  const { startGame, loading: startingGame } = useStartGame();
  const { createAlliance, loading: creatingAlliance } = useCreateAlliance();
  const { joinAlliance, loading: joiningAlliance } = useJoinAlliance();
  const { leaveAlliance, loading: leavingAlliance } = useLeaveAlliance();
  const roomId = params.roomId as string;

  const [players, setPlayers] = useState<Array<{ id: string; name: string; isHost: boolean }>>([]);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAllianceModal, setShowAllianceModal] = useState(false);
  const [allianceAction, setAllianceAction] = useState<'create' | 'join'>('create');
  const [allianceName, setAllianceName] = useState('');

  // Initialize players from game state
  useEffect(() => {
    if (gameState && gameState.players) {
      setPlayers(
        gameState.players.map((p) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
        }))
      );
      setMyPlayerId(gameState.myPlayerId);
    }
  }, [gameState]);

  // Listen for game state sync (when players join/leave)
  useSocketEvent<{ gameState: ClientGameState }>(SERVER_EVENTS.GAME_STATE_SYNC, (data) => {
    setGameState(data.gameState);
    setPlayers(
      data.gameState.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
      }))
    );
  });

  // Listen for new players joining
  useSocketEvent<PlayerJoinedPayload>(SERVER_EVENTS.PLAYER_JOINED, (data) => {
    setPlayers((prev) => {
      if (prev.some((p) => p.id === data.playerId)) {
        return prev;
      }
      return [...prev, { id: data.playerId, name: data.playerName, isHost: false }];
    });
  });

  // Listen for players leaving
  useSocketEvent<PlayerLeftPayload>(SERVER_EVENTS.PLAYER_LEFT, (data) => {
    setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
  });

  // Listen for game starting
  useSocketEvent<GameStartedPayload>(SERVER_EVENTS.GAME_STARTED, (data) => {
    setGameState(data.gameState);
    router.push(`/game/${roomId}`);
  });

  const handleStartGame = async () => {
    if (players.length < 2) {
      setError('Need at least 2 players to start');
      return;
    }

    try {
      setError('');
      await startGame(roomId, myPlayerId);
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave_room', { roomId, playerId: myPlayerId });
    }
    router.push('/');
  };

  const handleCreateAlliance = async () => {
    if (!allianceName.trim()) {
      setError('Please enter an alliance name');
      return;
    }

    try {
      await createAlliance(roomId, myPlayerId, allianceName.trim());
      setShowAllianceModal(false);
      setAllianceName('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to create alliance');
    }
  };

  const handleJoinAlliance = async (allianceId: string) => {
    try {
      await joinAlliance(roomId, myPlayerId, allianceId);
      setShowAllianceModal(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to join alliance');
    }
  };

  const handleLeaveAlliance = async () => {
    try {
      await leaveAlliance(roomId, myPlayerId);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to leave alliance');
    }
  };

  const isHost = players.find((p) => p.id === myPlayerId)?.isHost || false;
  const myAlliance = gameState?.alliances.find(a => a.id === gameState.myAllianceId);

  // Calculate circular positions for players
  const getCircularPosition = (index: number, total: number) => {
    const angleStep = (2 * Math.PI) / Math.max(total, 8); // Evenly distribute or use 8 slots
    const angle = angleStep * index - Math.PI / 2; // Start from top
    const radius = 35; // Percentage from center

    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);

    return { x, y };
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
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="relative w-full max-w-5xl">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/assets/logo.png"
              alt="UNO"
              width={100}
              height={100}
              className="drop-shadow-2xl animate-pulse-slow"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-2xl">
            Game Lobby
          </h1>
          <p className="text-gray-300 text-lg">Waiting for players to join...</p>
        </div>

        {/* Main Lobby Area */}
        <div className="relative">
          {/* Room Code Card - Top */}
          <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-lg px-4">
            <div className="bg-black/70 backdrop-blur-xl rounded-3xl px-6 md:px-10 py-6 border border-white/30 shadow-2xl">
              <div className="text-center">
                <p className="text-gray-300 text-xs uppercase tracking-wider mb-3 font-bold">ROOM CODE</p>
                <div className="flex items-center justify-center gap-3 md:gap-4 flex-nowrap">
                  <div className="text-3xl md:text-4xl font-black text-white font-mono tracking-[0.2em] whitespace-nowrap">
                    {formatRoomCode(roomId)}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-5 py-2 md:py-3 rounded-xl transition-all font-bold shadow-lg hover:scale-105 text-base md:text-lg flex-shrink-0"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Circular Player Area */}
          <div className="relative w-full aspect-square max-w-2xl mx-auto">
            {/* Center Circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-3/4 rounded-full bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border-4 border-white/10 shadow-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-black text-white mb-2">{players.length}/10</div>
                  <div className="text-xl text-gray-300 font-bold">PLAYERS</div>
                </div>
              </div>
            </div>

            {/* Players in Circle */}
            {players.map((player, index) => {
              const { x, y } = getCircularPosition(index, players.length);
              const isMe = player.id === myPlayerId;
              const playerAlliance = gameState?.players.find(p => p.id === player.id)?.allianceName;

              return (
                <div
                  key={player.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                  }}
                >
                  <div className="relative">
                    {/* Glow for current user */}
                    {isMe && (
                      <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-60 animate-pulse scale-150"></div>
                    )}

                    {/* Avatar */}
                    <div
                      className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 shadow-2xl ${
                        isMe ? 'border-blue-400 scale-110' : 'border-white/50'
                      }`}
                      style={{
                        background: isMe
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-black text-2xl md:text-3xl">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Host crown */}
                      {player.isHost && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-3xl">
                          👑
                        </div>
                      )}

                      {/* Ready indicator */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                        READY
                      </div>
                    </div>

                    {/* Player name */}
                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-white text-sm font-bold">
                          {player.name}
                          {isMe && <span className="text-blue-400 ml-1">(You)</span>}
                        </span>
                      </div>
                    </div>

                    {/* Alliance badge */}
                    {playerAlliance && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                        {playerAlliance}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 8 - players.length) }).map((_, index) => {
              const { x, y } = getCircularPosition(players.length + index, 8);

              return (
                <div
                  key={`empty-${index}`}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                  }}
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-dashed border-white/20 bg-white/5 flex items-center justify-center">
                    <span className="text-white/30 text-3xl">+</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-900/50 border border-red-600 rounded-lg p-3">
              <p className="text-red-200 text-sm text-center font-medium">{error}</p>
            </div>
          )}

          {/* Alliance Management - Show if alliances enabled */}
          {gameState?.alliancesEnabled && (
            <div className="mt-8 max-w-2xl mx-auto">
              {!myAlliance ? (
                <button
                  onClick={() => setShowAllianceModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition hover:scale-105"
                >
                  Manage Alliances
                </button>
              ) : (
                <div className="bg-purple-900/50 backdrop-blur-md rounded-xl p-4 border border-purple-500/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-purple-200 text-xs mb-1">YOUR ALLIANCE</div>
                      <div className="text-white font-black text-lg">{myAlliance.name}</div>
                      <div className="text-purple-300 text-sm">
                        {myAlliance.members.length}/{myAlliance.maxSize} members
                      </div>
                    </div>
                    <button
                      onClick={handleLeaveAlliance}
                      disabled={leavingAlliance}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition disabled:opacity-50"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-12 max-w-2xl mx-auto">
            <button
              onClick={handleLeaveRoom}
              className="flex-1 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white font-bold py-4 px-6 rounded-2xl border border-white/20 transition shadow-xl"
            >
              Leave Room
            </button>
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={startingGame || players.length < 2}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-4 px-6 rounded-2xl shadow-2xl shadow-green-500/50 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {startingGame ? 'STARTING...' : 'START GAME'}
              </button>
            ) : (
              <div className="flex-1 bg-black/40 text-gray-400 font-bold py-4 px-6 rounded-2xl text-center border border-white/10">
                Waiting for host...
              </div>
            )}
          </div>

          {/* Info text */}
          {players.length < 2 && (
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Need at least 2 players to start • Share the room code to invite friends
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Alliance Modal */}
      {showAllianceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-white/20">
            <h2 className="text-white text-2xl font-black mb-4">Alliances</h2>

            {/* Toggle between create and join */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAllianceAction('create')}
                className={`flex-1 py-2 rounded-lg font-bold transition ${
                  allianceAction === 'create'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                Create Alliance
              </button>
              <button
                onClick={() => setAllianceAction('join')}
                className={`flex-1 py-2 rounded-lg font-bold transition ${
                  allianceAction === 'join'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                Join Alliance
              </button>
            </div>

            {allianceAction === 'create' ? (
              <div>
                <input
                  type="text"
                  value={allianceName}
                  onChange={(e) => setAllianceName(e.target.value)}
                  placeholder="Alliance name"
                  maxLength={20}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white mb-4"
                />
                <button
                  onClick={handleCreateAlliance}
                  disabled={creatingAlliance}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {creatingAlliance ? 'Creating...' : 'Create Alliance'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {gameState?.alliances.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No alliances yet</p>
                ) : (
                  gameState?.alliances.map((alliance) => (
                    <button
                      key={alliance.id}
                      onClick={() => handleJoinAlliance(alliance.id)}
                      disabled={alliance.members.length >= alliance.maxSize || joiningAlliance}
                      className="w-full bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-lg transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">{alliance.name}</div>
                          <div className="text-sm text-gray-400">
                            {alliance.members.length}/{alliance.maxSize} members
                          </div>
                        </div>
                        {alliance.members.length >= alliance.maxSize && (
                          <span className="text-red-400 text-sm">Full</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            <button
              onClick={() => setShowAllianceModal(false)}
              className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
