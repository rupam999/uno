'use client';

import { useState, useCallback } from 'react';
import { ClientGameState, Color } from '@/lib/game/types';
import { useSocket, useSocketEvent } from '@/lib/socket/SocketContext';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@/lib/socket/events';
import { PlayerHand } from './PlayerHand';
import { PlayArea } from './PlayArea';
import { OpponentHands } from './OpponentHands';
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

  const currentGameState = gameState || initialGameState;
  const isMyTurn =
    currentGameState.players[currentGameState.currentPlayerIndex]?.id ===
    currentGameState.myPlayerId;

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
      showNotification(`You drew ${data.cardCount} card(s)`);
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
    showNotification(`🎉 ${data.winnerName} wins the game!`);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-white mb-2">UNO No Mercy</h1>
          <p className="text-gray-300 text-sm">
            Round {currentGameState.roundNumber} • Target: {currentGameState.targetScore} points
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 bg-gray-900 border border-gray-700 text-white px-6 py-3 rounded-lg shadow-2xl z-50 animate-slide-in">
            {notification}
          </div>
        )}

        {/* Color Picker Modal */}
        {showColorPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl">
              <h3 className="text-white font-bold text-xl mb-4 text-center">
                Choose a Color
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {(['red', 'blue', 'green', 'yellow'] as Color[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className="w-24 h-24 rounded-lg font-bold text-white shadow-lg transform transition hover:scale-110"
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

        {/* Game Layout */}
        <div className="space-y-6">
          {/* Opponents */}
          <OpponentHands
            players={currentGameState.players}
            currentPlayerIndex={currentGameState.currentPlayerIndex}
            myPlayerId={currentGameState.myPlayerId}
          />

          {/* Play Area */}
          <PlayArea
            topCard={currentGameState.topCard}
            currentColor={currentGameState.currentColor}
            deckCount={currentGameState.deckCount}
            pendingPenalty={currentGameState.pendingPenalty}
            direction={currentGameState.direction}
            onDrawPileClick={isMyTurn ? handleDrawCard : undefined}
          />

          {/* Player Hand */}
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
    </div>
  );
}
