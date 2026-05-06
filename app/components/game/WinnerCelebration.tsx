'use client';

import { useEffect, useState } from 'react';

interface WinnerCelebrationProps {
  show: boolean;
  winnerName: string;
  winnerScore?: number;
  reason?: 'cards-finished' | 'last-standing' | 'target-reached';
  onClose?: () => void;
}

export function WinnerCelebration({
  show,
  winnerName,
  winnerScore,
  reason = 'cards-finished',
  onClose,
}: WinnerCelebrationProps) {
  const [visible, setVisible] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Generate confetti
      const confettiArray = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
      }));
      setConfetti(confettiArray);
    }
  }, [show]);

  if (!visible) return null;

  const getMessage = () => {
    switch (reason) {
      case 'cards-finished':
        return 'All Cards Played!';
      case 'last-standing':
        return 'Last Player Standing!';
      case 'target-reached':
        return 'Target Score Reached!';
      default:
        return 'Victory!';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Confetti */}
      {confetti.map((conf) => (
        <div
          key={conf.id}
          className="absolute top-0 w-2 h-2 md:w-3 md:h-3 rounded-full animate-confetti"
          style={{
            left: `${conf.left}%`,
            animationDelay: `${conf.delay}s`,
            backgroundColor: ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#ec4899'][
              conf.id % 5
            ],
          }}
        />
      ))}

      {/* Winner Card */}
      <div className="relative bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-3xl p-8 md:p-12 shadow-2xl border-8 border-yellow-300 max-w-2xl mx-4 animate-scale-in">
        {/* Trophy Icon */}
        <div className="text-center mb-6">
          <div className="text-8xl md:text-9xl animate-bounce-slow">🏆</div>
        </div>

        {/* Winner Info */}
        <div className="text-center space-y-4">
          <h1 className="text-white font-black text-4xl md:text-6xl tracking-wider drop-shadow-lg animate-pulse-slow">
            {winnerName}
          </h1>

          <div className="text-white/90 font-bold text-xl md:text-2xl">
            {getMessage()}
          </div>

          {/* Celebration Text */}
          <div className="pt-4">
            <p className="text-white font-black text-3xl md:text-5xl animate-pulse">
              🎉 WINNER! 🎉
            </p>
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="mt-8 w-full bg-white hover:bg-gray-100 text-amber-600 font-black py-4 px-8 rounded-xl text-lg md:text-xl transition-all transform hover:scale-105 shadow-lg"
          >
            Back to Lobby
          </button>
        )}

        {/* Sparkles */}
        <div className="absolute top-4 left-4 text-4xl animate-spin-slow">✨</div>
        <div className="absolute top-4 right-4 text-4xl animate-spin-slow-reverse">✨</div>
        <div className="absolute bottom-4 left-4 text-4xl animate-bounce-slow">⭐</div>
        <div className="absolute bottom-4 right-4 text-4xl animate-bounce-slow delay-500">⭐</div>
      </div>
    </div>
  );
}
