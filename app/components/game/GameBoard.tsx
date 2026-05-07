'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ClientGameState, Color } from '@/lib/game/types';
import { useSocket, useSocketEvent } from '@/lib/socket/SocketContext';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@/lib/socket/events';
import { PlayerHand } from './PlayerHand';
import { PlayArea } from './PlayArea';
import { OpponentHands } from './OpponentHands';
import { GameNotification } from './GameNotification';
import { WinnerCelebration } from './WinnerCelebration';
import { requiresColorSelection, canPlayCard } from '@/server/game/validators';
import { getAvatarUrl } from '@/lib/utils/avatars';

interface GameBoardProps {
  initialGameState: ClientGameState;
  roomId: string;
}

export function GameBoard({ initialGameState, roomId }: GameBoardProps) {
  const { socket, gameState, setGameState } = useSocket();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showTurnNotification, setShowTurnNotification] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerData, setWinnerData] = useState<{ name: string; score?: number } | null>(null);
  const [turnTimer, setTurnTimer] = useState<number>(60);

  const currentGameState = gameState || initialGameState;
  const isMyTurn =
    currentGameState.players[currentGameState.currentPlayerIndex]?.id ===
    currentGameState.myPlayerId;

  // Turn timeout - 60 seconds
  useEffect(() => {
    if (!isMyTurn) {
      setTurnTimer(60);
      return;
    }

    // Reset timer when it becomes your turn
    setTurnTimer(60);

    const interval = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          // Time's up! Play a random card or draw
          handleAutoPlay();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMyTurn, currentGameState.currentPlayerIndex]);

  // Auto-play when time runs out
  const handleAutoPlay = useCallback(() => {
    if (!socket || !isMyTurn) return;

    const playableCards = currentGameState.myHand.filter((card) => {
      const topCard = currentGameState.topCard;
      if (!topCard) return false;
      return canPlayCard(card, topCard, currentGameState.currentColor as any, currentGameState.pendingPenalty);
    });

    if (playableCards.length > 0) {
      // Play a random playable card
      const randomCard = playableCards[Math.floor(Math.random() * playableCards.length)];

      // Check if it needs color selection
      if (requiresColorSelection(randomCard.type, currentGameState.pendingPenalty)) {
        // Pick a random color
        const colors: Color[] = ['red', 'blue', 'green', 'yellow'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        socket.emit(
          CLIENT_EVENTS.PLAY_CARD,
          {
            roomId,
            playerId: currentGameState.myPlayerId,
            cardId: randomCard.id,
            chosenColor: randomColor,
          },
          (response: any) => {
            if (response.success) {
              showNotification('Time expired - played random card');
            }
          }
        );
      } else {
        socket.emit(
          CLIENT_EVENTS.PLAY_CARD,
          {
            roomId,
            playerId: currentGameState.myPlayerId,
            cardId: randomCard.id,
          },
          (response: any) => {
            if (response.success) {
              showNotification('Time expired - played random card');
            }
          }
        );
      }
    } else {
      // No playable cards, draw
      handleDrawCard();
      showNotification('Time expired - drawing card');
    }
  }, [socket, isMyTurn, currentGameState, roomId]);

  // Show player picker when waiting for player choice (7 card swap)
  useEffect(() => {
    if (currentGameState.waitingForPlayerChoice && isMyTurn) {
      setShowPlayerPicker(true);
    } else {
      setShowPlayerPicker(false);
    }
  }, [currentGameState.waitingForPlayerChoice, isMyTurn]);

  // Keep turn notification visible during player's turn
  useEffect(() => {
    setShowTurnNotification(isMyTurn);
  }, [isMyTurn]);

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
      // Wild draw cards (6/10) don't need color when stacking
      if (requiresColorSelection(card.type, currentGameState.pendingPenalty)) {
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

  // Challenge/Catch UNO
  const handleChallengeUno = useCallback((targetId: string) => {
    if (!socket) return;

    socket.emit(
      CLIENT_EVENTS.CHALLENGE_UNO,
      {
        targetId,
      },
      (response: any) => {
        if (response.success) {
          showNotification('UNO Challenge Successful! 🚨');
        } else {
          showNotification(response.error || 'Challenge failed');
        }
      }
    );
  }, [socket]);

  // Handle player selection for hand swap (7 card)
  const handlePlayerSelect = useCallback((targetId: string) => {
    if (!socket) return;

    socket.emit(
      CLIENT_EVENTS.CHOOSE_PLAYER,
      {
        targetId,
      },
      (response: any) => {
        if (response.success) {
          setShowPlayerPicker(false);
          showNotification('Hands swapped!');
        } else {
          showNotification(response.error || 'Failed to swap hands');
        }
      }
    );
  }, [socket]);

  return (
    <div className="fixed inset-0 overflow-hidden">
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

      {/* Game Container */}
      <div className="relative w-full h-full flex flex-col">
        {/* Top Bar */}
        <div className="relative z-10 flex items-center justify-between px-4 py-3">
          {/* UNO Logo - Left */}
          <div className="flex items-center gap-3">
            <Image
              src="/assets/logo.png"
              alt="UNO"
              width={60}
              height={60}
              className="drop-shadow-2xl"
            />
            <div className={`rounded-full p-2 shadow-lg ${
              isMyTurn && turnTimer <= 10
                ? 'bg-gradient-to-br from-red-500 to-orange-600 animate-pulse'
                : 'bg-gradient-to-br from-yellow-500 to-orange-600'
            }`}>
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className={`font-bold text-xl ${
              isMyTurn && turnTimer <= 10 ? 'text-red-400 animate-pulse' : 'text-white'
            }`}>
              {isMyTurn ? `00:${turnTimer.toString().padStart(2, '0')}` : '01:12'}
            </span>
          </div>

          {/* Center - Empty (logo is on left now) */}
          <div></div>

          {/* Player Count & Menu - Right */}
          <div className="flex items-center gap-3">
            {currentGameState.unoCallWindow &&
             currentGameState.unoCallWindow.playerId !== currentGameState.myPlayerId && (
              <button
                onClick={() => handleChallengeUno(currentGameState.unoCallWindow!.playerId)}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-black text-sm px-4 py-2 rounded-full shadow-lg animate-pulse border-2 border-red-300"
              >
                🚨 CATCH!
              </button>
            )}
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="text-white font-bold">{currentGameState.players.filter(p => !p.isEliminated).length}/{currentGameState.players.length}</span>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-black/40 backdrop-blur-md hover:bg-black/60 p-2 rounded-full border border-white/20 transition"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 relative overflow-hidden min-h-0">
          {/* Game play area */}
          <div className="absolute inset-0 flex items-center justify-center px-2 py-4 md:p-4">
            <div className="relative w-full h-full max-w-6xl">
              {/* Opponents positioned around in circle */}
              <OpponentHands
                players={currentGameState.players}
                currentPlayerIndex={currentGameState.currentPlayerIndex}
                myPlayerId={currentGameState.myPlayerId}
              />

              {/* Draw Pile - Leftmost side, vertically centered */}
              <div className="absolute top-1/2 transform -translate-y-1/2 z-20">
                <button
                  onClick={handleDrawCard}
                  disabled={!isMyTurn}
                  className={`relative transform transition-all duration-300 ${
                    isMyTurn
                      ? 'hover:scale-110 hover:-translate-y-2 cursor-pointer active:scale-95'
                      : 'cursor-default opacity-50'
                  }`}
                >
                  {/* Stack effect */}
                  <div className="absolute inset-0 rounded-xl transform translate-x-1 translate-y-1 opacity-30 bg-blue-900"></div>
                  <div className="absolute inset-0 rounded-xl transform translate-x-2 translate-y-2 opacity-20 bg-blue-900"></div>

                  {/* Main card using UNO background image */}
                  <div className="relative w-24 h-36 md:w-28 md:h-42 rounded-xl border-4 border-white/30 shadow-2xl overflow-hidden">
                    <Image
                      src="/cards/uno_background.png"
                      alt="UNO Card Back"
                      fill
                      className="object-cover"
                    />
                  </div>

                  {isMyTurn && (
                    <div className="absolute inset-0 rounded-xl ring-4 ring-blue-400/50 animate-pulse"></div>
                  )}

                  {/* Deck count badge */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full px-3 py-1 border-2 border-white/50 shadow-xl min-w-[3rem] text-center">
                    <span className="text-white font-black text-sm">{currentGameState.deckCount}</span>
                  </div>
                </button>

                {/* Draw label */}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold whitespace-nowrap">
                  DRAW PILE
                </div>
              </div>

              {/* Center Play Area - Only discard pile */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-[0.7] md:scale-90">
                <PlayArea
                  topCard={currentGameState.topCard}
                  currentColor={currentGameState.currentColor}
                  pendingPenalty={currentGameState.pendingPenalty}
                  direction={currentGameState.direction}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Player Hand at Bottom - Very compact */}
        <div className="relative bg-gradient-to-t from-black/90 via-purple-900/50 to-transparent backdrop-blur-md p-1.5 md:p-3 pb-safe border-t border-purple-500/20 shadow-[0_-10px_30px_rgba(168,85,247,0.3)]">
          {/* Current Player Avatar - Bottom Left with Card Info */}
          <div className="absolute bottom-6 left-6 z-30 flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div
                className={`w-20 h-20 md:w-24 md:h-24 rounded-full border-4 shadow-2xl overflow-hidden ${
                  isMyTurn
                    ? 'border-green-400 shadow-green-400/50 ring-4 ring-green-400/30 animate-pulse'
                    : 'border-white/50'
                }`}
              >
                {/* Avatar from individual image */}
                <Image
                  src={getAvatarUrl(currentGameState.myPlayerId)}
                  alt="Your avatar"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Card count badge on avatar */}
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full w-10 h-10 flex items-center justify-center border-3 border-white shadow-lg">
                <span className="text-white font-black text-base">{currentGameState.myHand.length}</span>
              </div>
            </div>

            {/* Player Info Card */}
            <div className="bg-black/80 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20 shadow-xl">
              <div className="text-yellow-400 text-xs font-bold mb-1">You</div>
              <div className="text-white text-xl font-black">{currentGameState.myHand.length} Cards</div>
            </div>
          </div>

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

      {/* Turn Notification - Stays visible during your turn */}
      <GameNotification
        type="your-turn"
        message="YOUR TURN!"
        subMessage="Make your move"
        show={showTurnNotification}
        duration={0}
        onClose={() => {}}
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
            <h3 className="text-white font-bold text-xl mb-2 text-center">
              Choose a Color
            </h3>
            {currentGameState.currentColor && (
              <p className="text-gray-400 text-sm text-center mb-4">
                Current color: <span className="font-bold capitalize">{currentGameState.currentColor}</span>
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              {(['red', 'blue', 'green', 'yellow'] as Color[]).map((color) => {
                const isCurrentColor = color === currentGameState.currentColor;
                return (
                  <button
                    key={color}
                    onClick={() => !isCurrentColor && handleColorSelect(color)}
                    disabled={isCurrentColor}
                    className={`h-20 rounded-xl font-bold text-white shadow-lg transform transition ${
                      isCurrentColor
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:scale-110 active:scale-95'
                    }`}
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
                    {isCurrentColor && (
                      <div className="text-xs mt-1 opacity-70">Current</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Player Picker Modal (for 7 card hand swap) */}
      {showPlayerPicker && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl max-w-md w-full">
            <h3 className="text-white font-bold text-xl mb-2 text-center">
              Choose a Player to Swap Hands
            </h3>
            <p className="text-gray-400 text-sm text-center mb-4">
              You played a 7! Select who you want to swap hands with.
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {currentGameState.players
                .filter((p) => p.id !== currentGameState.myPlayerId && !p.isEliminated)
                .map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerSelect(player.id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black shadow-lg">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="font-bold">{player.name}</div>
                        <div className="text-xs text-purple-200">{player.cardCount} cards</div>
                      </div>
                    </div>
                    <div className="text-2xl">🔄</div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
