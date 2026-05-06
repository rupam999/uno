'use client';

import { useState, useCallback, useEffect } from 'react';
import { ClientGameState, Color } from '@/lib/game/types';
import { useSocket, useSocketEvent } from '@/lib/socket/SocketContext';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@/lib/socket/events';
import { PlayerHand } from './PlayerHand';
import { PlayArea } from './PlayArea';
import { OpponentHands } from './OpponentHands';
import { GameNotification } from './GameNotification';
import { WinnerCelebration } from './WinnerCelebration';
import { requiresColorSelection } from '@/server/game/validators';

interface GameBoardProps {
  initialGameState: ClientGameState;
  roomId: string;
}

export function GameBoard({ initialGameState, roomId }: GameBoardProps) {
  const { socket, gameState, setGameState } = useSocket();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showTurnNotification, setShowTurnNotification] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerData, setWinnerData] = useState<{ name: string; score?: number } | null>(null);

  const currentGameState = gameState || initialGameState;
  const isMyTurn =
    currentGameState.players[currentGameState.currentPlayerIndex]?.id ===
    currentGameState.myPlayerId;

  // Show turn notification when it becomes player's turn
  useEffect(() => {
    if (isMyTurn && gameState) {
      setShowTurnNotification(true);
    }
  }, [isMyTurn, gameState]);

  // Show notification
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Listen for game state updates
  useSocketEvent<{ gameState: ClientGameState }>(SERVER_EVENTS.GAME_STATE_SYNC, (data) => {
    setGameState(data.gameState);
  });

  // Listen for card played
  useSocketEvent(SERVER_EVENTS.CARD_PLAYED, (data: any) => {
    const player = currentGameState.players.find((p) => p.id === data.playerId);
    showNotification(`${player?.name || 'Player'} played a card`);
  });

  // Listen for card drawn
  useSocketEvent(SERVER_EVENTS.CARD_DRAWN, (data: any) => {
    const player = currentGameState.players.find((p) => p.id === data.playerId);
    if (data.playerId === currentGameState.myPlayerId) {
      if (data.canPlay) {
        showNotification(`You drew ${data.cardCount} card - You can play it or pass!`);
      } else {
        showNotification(`You drew ${data.cardCount} card - Turn passed`);
      }
    } else {
      showNotification(`${player?.name || 'Player'} drew ${data.cardCount} card(s)`);
    }
  });

  // Listen for turn changed
  useSocketEvent(SERVER_EVENTS.TURN_CHANGED, (data: any) => {
    const player = currentGameState.players.find((p) => p.id === data.currentPlayerId);
    if (data.currentPlayerId === currentGameState.myPlayerId) {
      showNotification("It's your turn!");
    } else {
      showNotification(`${player?.name || 'Player'}'s turn`);
    }
  });

  // Listen for player eliminated
  useSocketEvent(SERVER_EVENTS.PLAYER_ELIMINATED, (data: any) => {
    showNotification(`${data.playerName} has been eliminated!`);
  });

  // Listen for game ended
  useSocketEvent(SERVER_EVENTS.GAME_ENDED, (data: any) => {
    setWinnerData({
      name: data.winnerName,
      score: data.finalScores?.[data.winnerId],
    });
    setShowWinner(true);
  });

  // Play a card
  const handleCardSelect = useCallback(
    (cardId: string) => {
      if (!socket || !isMyTurn) return;

      const card = currentGameState.myHand.find((c) => c.id === cardId);
      if (!card) return;

      // Check if wild card needs color selection
      if (requiresColorSelection(card.type)) {
        setPendingCardId(cardId);
        setShowColorPicker(true);
        return;
      }

      // Play the card
      socket.emit(
        CLIENT_EVENTS.PLAY_CARD,
        {
          roomId,
          playerId: currentGameState.myPlayerId,
          cardId,
        },
        (response: any) => {
          if (!response.success) {
            showNotification(response.error || 'Cannot play that card');
          }
        }
      );
    },
    [socket, isMyTurn, currentGameState, roomId]
  );

  // Select color for wild card
  const handleColorSelect = useCallback(
    (color: Color) => {
      if (!socket || !pendingCardId) return;

      socket.emit(
        CLIENT_EVENTS.PLAY_CARD,
        {
          roomId,
          playerId: currentGameState.myPlayerId,
          cardId: pendingCardId,
          chosenColor: color,
        },
        (response: any) => {
          if (!response.success) {
            showNotification(response.error || 'Cannot play that card');
          }
        }
      );

      setShowColorPicker(false);
      setPendingCardId(null);
    },
    [socket, pendingCardId, currentGameState, roomId]
  );

  // Draw a card
  const handleDrawCard = useCallback(() => {
    if (!socket || !isMyTurn) return;

    socket.emit(
      CLIENT_EVENTS.DRAW_CARD,
      {
        roomId,
        playerId: currentGameState.myPlayerId,
      },
      (response: any) => {
        if (!response.success) {
          showNotification(response.error || 'Cannot draw card');
        }
      }
    );
  }, [socket, isMyTurn, currentGameState, roomId]);

  // Call UNO
  const handleCallUno = useCallback(() => {
    if (!socket) return;

    socket.emit(
      CLIENT_EVENTS.CALL_UNO,
      {
        roomId,
        playerId: currentGameState.myPlayerId,
      },
      (response: any) => {
        if (response.success) {
          showNotification('UNO! 🎉');
        }
      }
    );
  }, [socket, currentGameState, roomId]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Game Container with Table */}
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/40 backdrop-blur-md border-b border-purple-500/20 shadow-lg">
          <div>
            <h1 className="text-base md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600">
              UNO NO MERCY
            </h1>
            <p className="text-xs text-purple-300 font-medium">
              Round {currentGameState.roundNumber} • Target: {currentGameState.targetScore}
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="text-gray-300 hover:text-white text-xs md:text-sm px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 transition-all duration-300 font-semibold"
          >
            Leave
          </button>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 relative overflow-hidden min-h-0">
          {/* Game Table (Oval) */}
          <div className="absolute inset-0 flex items-center justify-center px-2 py-4 md:p-4">
            {/* Table Surface */}
            <div className="relative w-full h-full max-w-7xl">
              {/* Outer glow */}
              <div className="absolute inset-2 md:inset-6 bg-gradient-to-br from-green-600/20 to-emerald-700/20 rounded-[50%] blur-2xl"></div>

              {/* Oval Table */}
              <div className="absolute inset-4 md:inset-8 bg-gradient-to-br from-green-700 via-green-800 to-green-900 rounded-[50%] shadow-2xl border-4 md:border-8 border-amber-800/70">
                {/* Table shine effect */}
                <div className="absolute inset-0 rounded-[50%] bg-gradient-to-br from-white/10 via-transparent to-transparent"></div>

                {/* Table Pattern */}
                <div className="absolute inset-0 rounded-[50%] opacity-30 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

                {/* Felt texture */}
                <div className="absolute inset-0 rounded-[50%] opacity-5" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,.5) 2px, rgba(0,0,0,.5) 4px)'
                }}></div>
              </div>

              {/* Opponents positioned around table */}
              <OpponentHands
                players={currentGameState.players}
                currentPlayerIndex={currentGameState.currentPlayerIndex}
                myPlayerId={currentGameState.myPlayerId}
              />

              {/* Center Play Area */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-[0.7] md:scale-90">
                <PlayArea
                  topCard={currentGameState.topCard}
                  currentColor={currentGameState.currentColor}
                  deckCount={currentGameState.deckCount}
                  pendingPenalty={currentGameState.pendingPenalty}
                  direction={currentGameState.direction}
                  onDrawPileClick={isMyTurn ? handleDrawCard : undefined}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Player Hand at Bottom - Very compact */}
        <div className="relative bg-gradient-to-t from-black/90 via-purple-900/50 to-transparent backdrop-blur-md p-1.5 md:p-3 pb-safe border-t border-purple-500/20 shadow-[0_-10px_30px_rgba(168,85,247,0.3)]">
          <PlayerHand
            cards={currentGameState.myHand}
            topCard={currentGameState.topCard}
            currentColor={currentGameState.currentColor}
            pendingPenalty={currentGameState.pendingPenalty}
            isMyTurn={isMyTurn}
            onCardSelect={handleCardSelect}
            onDrawCard={handleDrawCard}
            onCallUno={handleCallUno}
          />
        </div>
      </div>

      {/* Turn Notification */}
      <GameNotification
        type="your-turn"
        message="YOUR TURN!"
        subMessage="Make your move"
        show={showTurnNotification}
        duration={2000}
        onClose={() => setShowTurnNotification(false)}
      />

      {/* Winner Celebration */}
      {showWinner && winnerData && (
        <WinnerCelebration
          show={showWinner}
          winnerName={winnerData.name}
          winnerScore={winnerData.score}
          reason="cards-finished"
          onClose={() => {
            setShowWinner(false);
            window.location.href = '/';
          }}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 bg-gray-900 border border-gray-700 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-slide-in">
          {notification}
        </div>
      )}

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl max-w-sm w-full">
            <h3 className="text-white font-bold text-xl mb-4 text-center">
              Choose a Color
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {(['red', 'blue', 'green', 'yellow'] as Color[]).map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className="h-20 rounded-xl font-bold text-white shadow-lg transform transition hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor:
                      color === 'red'
                        ? '#ef4444'
                        : color === 'blue'
                        ? '#3b82f6'
                        : color === 'green'
                        ? '#22c55e'
                        : '#eab308',
                  }}
                >
                  {color.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
