'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket, useSocketEvent, useStartGame } from '@/lib/socket/SocketContext';
import { formatRoomCode } from '@/lib/utils/roomCode';
import { PlayerJoinedPayload, PlayerLeftPayload, GameStartedPayload, ClientGameState } from '@/lib/game/types';
import { SERVER_EVENTS } from '@/lib/socket/events';

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { socket, gameState, setGameState } = useSocket();
  const { startGame, loading: startingGame } = useStartGame();
  const roomId = params.roomId as string;

  const [players, setPlayers] = useState<Array<{ id: string; name: string; isHost: boolean }>>([]);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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
    console.log('Game state synced:', data);
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
    console.log('Player joined:', data);
    // Refresh by fetching updated game state - we'll add players manually for now
    setPlayers((prev) => {
      // Check if player already exists
      if (prev.some((p) => p.id === data.playerId)) {
        return prev;
      }
      return [...prev, { id: data.playerId, name: data.playerName, isHost: false }];
    });
  });

  // Listen for players leaving
  useSocketEvent<PlayerLeftPayload>(SERVER_EVENTS.PLAYER_LEFT, (data) => {
    console.log('Player left:', data);
    setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
  });

  // Listen for game starting
  useSocketEvent<GameStartedPayload>(SERVER_EVENTS.GAME_STARTED, (data) => {
    console.log('Game started:', data);
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
      // Navigation will happen automatically when GAME_STARTED event is received
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

  const isHost = players.find((p) => p.id === myPlayerId)?.isHost || false;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-2xl">
            Game Lobby
          </h1>
          <p className="text-gray-300">Waiting for players to join...</p>
        </div>

        {/* Room Code Card */}
        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-gray-700 mb-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2 font-medium">Room Code</p>
            <div className="flex items-center justify-center gap-3">
              <div className="text-4xl font-bold text-white font-mono tracking-widest bg-gray-800 px-6 py-3 rounded-lg border border-gray-600">
                {formatRoomCode(roomId)}
              </div>
              <button
                onClick={handleCopyCode}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition font-medium"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              Share this code with friends to invite them
            </p>
          </div>
        </div>

        {/* Players Card */}
        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              Players ({players.length}/10)
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">Waiting</span>
            </div>
          </div>

          {/* Players List */}
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-gray-800 rounded-lg p-4 flex items-center justify-between border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {player.name}
                      {player.id === myPlayerId && (
                        <span className="text-blue-400 text-sm ml-2">(You)</span>
                      )}
                    </p>
                  </div>
                </div>
                {player.isHost && (
                  <span className="bg-yellow-900/50 text-yellow-300 text-xs px-3 py-1 rounded-full border border-yellow-600 font-medium">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>

          {players.length < 2 && (
            <div className="mt-4 bg-blue-900/40 border border-blue-600 rounded-lg p-3">
              <p className="text-blue-200 text-sm text-center font-medium">
                Waiting for at least 2 players to start the game
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-600 rounded-lg p-3">
            <p className="text-red-200 text-sm text-center font-medium">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleLeaveRoom}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium py-4 px-6 rounded-lg border border-gray-600 transition"
          >
            Leave Room
          </button>
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={startingGame || players.length < 2}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {startingGame ? 'Starting...' : 'Start Game'}
            </button>
          )}
          {!isHost && (
            <div className="flex-1 bg-gray-800/50 text-gray-400 font-medium py-4 px-6 rounded-lg text-center border border-gray-700">
              Waiting for host to start...
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            UNO by Alliance • 2-10 players • Draw stacking enabled
          </p>
        </div>
      </div>
    </div>
  );
}
