'use client';

import { useEffect, useState } from 'react';

interface GameNotificationProps {
  type: 'your-turn' | 'winner' | 'eliminated' | 'info';
  message: string;
  subMessage?: string;
  show: boolean;
  duration?: number;
  onClose?: () => void;
}

export function GameNotification({
  type,
  message,
  subMessage,
  show,
  duration = 3000,
  onClose,
}: GameNotificationProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (show && duration > 0 && onClose) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!visible) return null;

  const styles = {
    'your-turn': 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 border-green-300',
    'winner': 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 border-yellow-300',
    'eliminated': 'bg-gradient-to-r from-red-500 via-pink-500 to-red-600 border-red-300',
    'info': 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 border-blue-300',
  };

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 md:px-8 py-4 md:py-6 rounded-2xl shadow-2xl border-4 ${styles[type]} animate-bounce-in`}
      style={{ maxWidth: '90vw' }}
    >
      <div className="text-center">
        <h2 className="text-white font-black text-2xl md:text-4xl tracking-wider drop-shadow-lg">
          {message}
        </h2>
        {subMessage && (
          <p className="text-white/90 font-bold text-sm md:text-lg mt-2 drop-shadow">
            {subMessage}
          </p>
        )}
      </div>
      {type === 'your-turn' && (
        <div className="absolute inset-0 rounded-2xl animate-pulse-ring pointer-events-none" />
      )}
    </div>
  );
}
