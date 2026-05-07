'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { CLIENT_EVENTS } from '@/lib/socket/events';
import type {
  ClientGameState,
  CreateRoomResponse,
  JoinRoomResponse,
} from '@/lib/game/types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  gameState: ClientGameState | null;
  setGameState: (state: ClientGameState | null) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    gameState,
    setGameState,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Custom hook for handling socket events with cleanup
 */
export function useSocketEvent<T = any>(
  eventName: string,
  handler: (data: T) => void
): void {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName, handler]);
}

/**
 * Hook for creating a room
 */
export function useCreateRoom() {
  const { socket } = useSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCallback(
    (playerName: string, enableAlliances: boolean = false, maxAllianceSize: number = 2): Promise<CreateRoomResponse> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        setLoading(true);
        setError(null);

        socket.emit('create_room', { playerName, enableAlliances, maxAllianceSize }, (response: CreateRoomResponse) => {
          setLoading(false);

          if (response.success) {
            resolve(response);
          } else {
            const errorMsg = response.error || 'Failed to create room';
            setError(errorMsg);
            reject(new Error(errorMsg));
          }
        });
      });
    },
    [socket]
  );

  return { createRoom, loading, error };
}

/**
 * Hook for joining a room
 */
export function useJoinRoom() {
  const { socket, setGameState } = useSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinRoom = useCallback(
    (roomId: string, playerName: string): Promise<JoinRoomResponse> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        setLoading(true);
        setError(null);

        socket.emit('join_room', { roomId, playerName }, (response: JoinRoomResponse) => {
          setLoading(false);

          if (response.success && response.gameState) {
            setGameState(response.gameState);
            resolve(response);
          } else {
            const errorMsg = response.error || 'Failed to join room';
            setError(errorMsg);
            reject(new Error(errorMsg));
          }
        });
      });
    },
    [socket, setGameState]
  );

  return { joinRoom, loading, error };
}

/**
 * Hook for starting a game
 */
export function useStartGame() {
  const { socket } = useSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGame = useCallback(
    (roomId: string, hostId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        setLoading(true);
        setError(null);

        socket.emit('start_game', { roomId, hostId }, (response: any) => {
          setLoading(false);

          if (response?.success) {
            resolve();
          } else {
            const errorMsg = response?.error || 'Failed to start game';
            setError(errorMsg);
            reject(new Error(errorMsg));
          }
        });
      });
    },
    [socket]
  );

  return { startGame, loading, error };
}

/**
 * Hook for creating an alliance
 */
export function useCreateAlliance() {
  const { socket } = useSocket();
  const [loading, setLoading] = useState(false);

  const createAlliance = useCallback(
    (roomId: string, playerId: string, allianceName: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Not connected'));
          return;
        }

        setLoading(true);
        socket.emit(
          CLIENT_EVENTS.CREATE_ALLIANCE,
          { roomId, playerId, allianceName },
          (response: any) => {
            setLoading(false);
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error(response.error));
            }
          }
        );
      });
    },
    [socket]
  );

  return { createAlliance, loading };
}

/**
 * Hook for joining an alliance
 */
export function useJoinAlliance() {
  const { socket } = useSocket();
  const [loading, setLoading] = useState(false);

  const joinAlliance = useCallback(
    (roomId: string, playerId: string, allianceId: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Not connected'));
          return;
        }

        setLoading(true);
        socket.emit(
          CLIENT_EVENTS.JOIN_ALLIANCE,
          { roomId, playerId, allianceId },
          (response: any) => {
            setLoading(false);
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error(response.error));
            }
          }
        );
      });
    },
    [socket]
  );

  return { joinAlliance, loading };
}

/**
 * Hook for leaving an alliance
 */
export function useLeaveAlliance() {
  const { socket } = useSocket();
  const [loading, setLoading] = useState(false);

  const leaveAlliance = useCallback(
    (roomId: string, playerId: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Not connected'));
          return;
        }

        setLoading(true);
        socket.emit(
          CLIENT_EVENTS.LEAVE_ALLIANCE,
          { roomId, playerId },
          (response: any) => {
            setLoading(false);
            if (response.success) {
              resolve(response);
            } else {
              reject(new Error(response.error));
            }
          }
        );
      });
    },
    [socket]
  );

  return { leaveAlliance, loading };
}
