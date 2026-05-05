import { Server as SocketIOServer, Socket } from 'socket.io';
import { GameRoom } from '../game/GameRoom';
import {
  CreateRoomPayload,
  JoinRoomPayload,
  PlayCardPayload,
  DrawCardPayload,
  CallUnoPayload,
  ChoosePlayerPayload,
  StartGamePayload,
  LeaveRoomPayload,
  Color,
} from '@/lib/game/types';
import { CLIENT_EVENTS, SERVER_EVENTS } from '@/lib/socket/events';
import { isValidPlayerName, isValidRoomCode } from '../game/validators';

// Store all active game rooms
const rooms = new Map<string, GameRoom>();

// Map socket IDs to player IDs and room IDs
const socketToPlayer = new Map<string, { playerId: string; roomId: string }>();

/**
 * Generate a random 6-character room code
 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a unique room code
 */
function generateUniqueRoomCode(): string {
  let code: string;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));
  return code;
}

/**
 * Setup Socket.IO event handlers
 */
export function setupSocketHandlers(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    /**
     * CREATE ROOM
     */
    socket.on(CLIENT_EVENTS.CREATE_ROOM, (payload: CreateRoomPayload, callback) => {
      try {
        const { playerName } = payload;

        if (!isValidPlayerName(playerName)) {
          callback({ success: false, error: 'Invalid player name' });
          return;
        }

        const roomId = generateUniqueRoomCode();
        const playerId = socket.id;

        const room = new GameRoom(roomId);
        const added = room.addPlayer(playerId, playerName.trim());

        if (!added) {
          callback({ success: false, error: 'Failed to create room' });
          return;
        }

        rooms.set(roomId, room);
        socketToPlayer.set(socket.id, { playerId, roomId });

        socket.join(roomId);

        callback({ success: true, roomId, playerId });

        console.log(`Room created: ${roomId} by ${playerName}`);
      } catch (error) {
        console.error('Error creating room:', error);
        callback({ success: false, error: 'Server error' });
      }
    });

    /**
     * JOIN ROOM
     */
    socket.on(CLIENT_EVENTS.JOIN_ROOM, (payload: JoinRoomPayload, callback) => {
      try {
        const { roomId, playerName } = payload;

        if (!isValidRoomCode(roomId)) {
          callback({ success: false, error: 'Invalid room code' });
          return;
        }

        if (!isValidPlayerName(playerName)) {
          callback({ success: false, error: 'Invalid player name' });
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        if (room.state !== 'waiting') {
          callback({ success: false, error: 'Game already in progress' });
          return;
        }

        const playerId = socket.id;
        const added = room.addPlayer(playerId, playerName.trim());

        if (!added) {
          callback({ success: false, error: 'Room is full or game started' });
          return;
        }

        socketToPlayer.set(socket.id, { playerId, roomId });
        socket.join(roomId);

        // Send game state to joining player
        const gameState = room.toClientGameState(playerId);
        callback({ success: true, playerId, gameState });

        // Notify others about the new player
        socket.to(roomId).emit(SERVER_EVENTS.PLAYER_JOINED, {
          playerId,
          playerName: playerName.trim(),
          playerCount: room.players.size,
        });

        // Send updated game state to ALL players in the room (including the one who just joined)
        room.players.forEach((_, pid) => {
          const updatedGameState = room.toClientGameState(pid);
          io.to(pid).emit(SERVER_EVENTS.GAME_STATE_SYNC, { gameState: updatedGameState });
        });

        console.log(`${playerName} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, error: 'Server error' });
      }
    });

    /**
     * START GAME
     */
    socket.on(CLIENT_EVENTS.START_GAME, (payload: StartGamePayload, callback) => {
      try {
        const mapping = socketToPlayer.get(socket.id);
        if (!mapping) {
          callback?.({ success: false, error: 'Not in a room' });
          return;
        }

        const { roomId } = mapping;
        const room = rooms.get(roomId);
        if (!room) {
          callback?.({ success: false, error: 'Room not found' });
          return;
        }

        const player = room.players.get(socket.id);
        if (!player || !player.isHost) {
          callback?.({ success: false, error: 'Only host can start game' });
          return;
        }

        const started = room.startGame();
        if (!started) {
          callback?.({ success: false, error: 'Failed to start game' });
          return;
        }

        // Send game state to all players
        room.players.forEach((_, playerId) => {
          const gameState = room.toClientGameState(playerId);
          io.to(playerId).emit(SERVER_EVENTS.GAME_STARTED, { gameState });
        });

        callback?.({ success: true });

        console.log(`Game started in room ${roomId}`);
      } catch (error) {
        console.error('Error starting game:', error);
        callback?.({ success: false, error: 'Server error' });
      }
    });

    /**
     * PLAY CARD
     */
    socket.on(CLIENT_EVENTS.PLAY_CARD, (payload: PlayCardPayload, callback) => {
      try {
        const { cardId, chosenColor } = payload;
        const mapping = socketToPlayer.get(socket.id);

        if (!mapping) {
          callback?.({ success: false, error: 'Not in a room' });
          return;
        }

        const { roomId, playerId } = mapping;
        const room = rooms.get(roomId);
        if (!room) {
          callback?.({ success: false, error: 'Room not found' });
          return;
        }

        const result = room.playCard(playerId, cardId, chosenColor as Color);

        if (!result.success) {
          callback?.({ success: false, error: result.error });
          return;
        }

        callback?.({ success: true });

        // Broadcast card played to all players
        io.to(roomId).emit(SERVER_EVENTS.CARD_PLAYED, {
          playerId,
          card: result.card,
          newTopCard: room.topCard,
          chosenColor,
        });

        // Send updated game state to all players
        room.players.forEach((_, pid) => {
          const gameState = room.toClientGameState(pid);
          io.to(pid).emit(SERVER_EVENTS.GAME_STATE_SYNC, { gameState });
        });

        // Emit turn changed
        const currentPlayer = room.getCurrentPlayer();
        if (currentPlayer) {
          io.to(roomId).emit(SERVER_EVENTS.TURN_CHANGED, {
            currentPlayerId: currentPlayer.id,
            nextPlayerId: currentPlayer.id,
          });
        }

        // Check for eliminations
        if (result.eliminatedPlayers && result.eliminatedPlayers.length > 0) {
          result.eliminatedPlayers.forEach((eliminatedId) => {
            const eliminatedPlayer = room.players.get(eliminatedId);
            if (eliminatedPlayer) {
              io.to(roomId).emit(SERVER_EVENTS.PLAYER_ELIMINATED, {
                playerId: eliminatedId,
                playerName: eliminatedPlayer.name,
                reason: 'mercy_rule',
              });
            }
          });
        }

        // Check for round/game end
        if (room.state === 'finished') {
          const winner = Array.from(room.players.values()).find((p) => !p.isEliminated);
          if (winner) {
            const scores: Record<string, number> = {};
            room.players.forEach((p) => {
              scores[p.id] = p.score;
            });

            io.to(roomId).emit(SERVER_EVENTS.GAME_ENDED, {
              winnerId: winner.id,
              winnerName: winner.name,
              finalScores: scores,
            });
          }
        }
      } catch (error) {
        console.error('Error playing card:', error);
        callback?.({ success: false, error: 'Server error' });
      }
    });

    /**
     * DRAW CARD
     */
    socket.on(CLIENT_EVENTS.DRAW_CARD, (payload: DrawCardPayload, callback) => {
      try {
        const mapping = socketToPlayer.get(socket.id);

        if (!mapping) {
          callback?.({ success: false, error: 'Not in a room' });
          return;
        }

        const { roomId, playerId } = mapping;
        const room = rooms.get(roomId);
        if (!room) {
          callback?.({ success: false, error: 'Room not found' });
          return;
        }

        const result = room.drawCard(playerId);

        if (!result.success) {
          callback?.({ success: false, error: result.error });
          return;
        }

        callback?.({ success: true, cards: result.cards });

        // Notify all players (but only show card count to others)
        room.players.forEach((_, pid) => {
          if (pid === playerId) {
            // Send actual cards to the player who drew
            io.to(pid).emit(SERVER_EVENTS.CARD_DRAWN, {
              playerId,
              cardCount: result.cards?.length || 0,
              drawnCard: result.cards,
            });
          } else {
            // Only send count to others
            io.to(pid).emit(SERVER_EVENTS.CARD_DRAWN, {
              playerId,
              cardCount: result.cards?.length || 0,
            });
          }
        });

        // Check for elimination
        if (result.eliminatedPlayer) {
          const player = room.players.get(playerId);
          if (player) {
            io.to(roomId).emit(SERVER_EVENTS.PLAYER_ELIMINATED, {
              playerId,
              playerName: player.name,
              reason: 'mercy_rule',
            });
          }
        }

        // Send updated game state
        room.players.forEach((_, pid) => {
          const gameState = room.toClientGameState(pid);
          io.to(pid).emit(SERVER_EVENTS.GAME_STATE_SYNC, { gameState });
        });

        // Emit turn changed if turn advanced
        if (!result.autoPlay) {
          const currentPlayer = room.getCurrentPlayer();
          if (currentPlayer) {
            io.to(roomId).emit(SERVER_EVENTS.TURN_CHANGED, {
              currentPlayerId: currentPlayer.id,
              nextPlayerId: currentPlayer.id,
            });
          }
        }
      } catch (error) {
        console.error('Error drawing card:', error);
        callback?.({ success: false, error: 'Server error' });
      }
    });

    /**
     * CALL UNO
     */
    socket.on(CLIENT_EVENTS.CALL_UNO, (payload: CallUnoPayload, callback) => {
      try {
        const mapping = socketToPlayer.get(socket.id);

        if (!mapping) {
          callback?.({ success: false, error: 'Not in a room' });
          return;
        }

        const { roomId, playerId } = mapping;
        const room = rooms.get(roomId);
        if (!room) {
          callback?.({ success: false, error: 'Room not found' });
          return;
        }

        const success = room.callUno(playerId);

        if (!success) {
          callback?.({ success: false, error: 'Cannot call UNO' });
          return;
        }

        callback?.({ success: true });

        // Notify all players
        io.to(roomId).emit(SERVER_EVENTS.UNO_CALLED, { playerId });
      } catch (error) {
        console.error('Error calling UNO:', error);
        callback?.({ success: false, error: 'Server error' });
      }
    });

    /**
     * CHOOSE PLAYER (for hand swap with 7 card)
     */
    socket.on(CLIENT_EVENTS.CHOOSE_PLAYER, (payload: ChoosePlayerPayload, callback) => {
      try {
        const { targetId } = payload;
        const mapping = socketToPlayer.get(socket.id);

        if (!mapping) {
          callback?.({ success: false, error: 'Not in a room' });
          return;
        }

        const { roomId, playerId } = mapping;
        const room = rooms.get(roomId);
        if (!room) {
          callback?.({ success: false, error: 'Room not found' });
          return;
        }

        const success = room.swapHands(playerId, targetId);

        if (!success) {
          callback?.({ success: false, error: 'Invalid hand swap' });
          return;
        }

        callback?.({ success: true });

        const player = room.players.get(playerId);
        const target = room.players.get(targetId);

        // Notify all players
        io.to(roomId).emit(SERVER_EVENTS.HAND_SWAPPED, {
          player1Id: playerId,
          player2Id: targetId,
          player1Name: player?.name || '',
          player2Name: target?.name || '',
        });

        // Send updated game state
        room.players.forEach((_, pid) => {
          const gameState = room.toClientGameState(pid);
          io.to(pid).emit(SERVER_EVENTS.GAME_STATE_SYNC, { gameState });
        });

        // Emit turn changed
        const currentPlayer = room.getCurrentPlayer();
        if (currentPlayer) {
          io.to(roomId).emit(SERVER_EVENTS.TURN_CHANGED, {
            currentPlayerId: currentPlayer.id,
            nextPlayerId: currentPlayer.id,
          });
        }
      } catch (error) {
        console.error('Error choosing player:', error);
        callback?.({ success: false, error: 'Server error' });
      }
    });

    /**
     * LEAVE ROOM
     */
    socket.on(CLIENT_EVENTS.LEAVE_ROOM, (payload: LeaveRoomPayload) => {
      handlePlayerLeave(socket);
    });

    /**
     * DISCONNECT
     */
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      handlePlayerLeave(socket);
    });
  });

  // Cleanup inactive rooms every 5 minutes
  setInterval(() => {
    const now = Date.now();
    rooms.forEach((room, roomId) => {
      if (room.isInactive()) {
        console.log(`Cleaning up inactive room: ${roomId}`);
        rooms.delete(roomId);
      }
    });
  }, 5 * 60 * 1000);
}

/**
 * Handle player leaving/disconnecting
 */
function handlePlayerLeave(socket: Socket): void {
  const mapping = socketToPlayer.get(socket.id);
  if (!mapping) {
    return;
  }

  const { roomId, playerId } = mapping;
  const room = rooms.get(roomId);

  if (room) {
    const player = room.players.get(playerId);
    const playerName = player?.name || 'Unknown';

    if (room.state === 'waiting') {
      // Remove player completely in waiting state
      room.removePlayer(playerId);
      socket.to(roomId).emit(SERVER_EVENTS.PLAYER_LEFT, {
        playerId,
        playerName,
        playerCount: room.players.size,
      });

      // Delete room if empty
      if (room.players.size === 0) {
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      }
    } else {
      // Mark as disconnected during game
      player?.disconnect();
      socket.to(roomId).emit(SERVER_EVENTS.PLAYER_DISCONNECTED, {
        playerId,
        playerName,
      });
    }
  }

  socketToPlayer.delete(socket.id);
}
