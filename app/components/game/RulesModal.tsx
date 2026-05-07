'use client';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  return (
    <>
      {/* Overlay - Only on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden"
          onClick={onClose}
        />
      )}

      {/* Rules Panel - Sliding from right */}
      <div
        className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-gray-900/95 backdrop-blur-lg border-l border-orange-500/30 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-orange-500/30 bg-gradient-to-r from-red-600/20 to-yellow-600/20">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-full p-1.5 md:p-2">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-base md:text-lg">Game Rules</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto px-3 md:px-4 py-3 md:py-4 space-y-3 md:space-y-4" style={{ height: 'calc(100vh - 64px)' }}>

          {/* Basic Rules */}
          <div className="bg-gray-800/50 rounded-xl p-3 border border-yellow-500/20">
            <h3 className="text-yellow-400 font-bold text-sm md:text-base mb-2 flex items-center gap-2">
              <span className="text-base md:text-lg">🎯</span> Basic Rules
            </h3>
            <ul className="text-gray-300 text-xs space-y-1 list-disc list-inside">
              <li>Match cards by color, number, or symbol</li>
              <li>168-card deck with No Mercy cards</li>
              <li>Draw until you can play</li>
              <li>Call UNO before playing 2nd-to-last card</li>
              <li>First to empty hand wins</li>
              <li>15-second turn timer</li>
            </ul>
          </div>

          {/* Special Cards */}
          <div className="bg-gray-800/50 rounded-xl p-3 border border-blue-500/20">
            <h3 className="text-blue-400 font-bold text-sm md:text-base mb-2 flex items-center gap-2">
              <span className="text-base md:text-lg">🃏</span> Special Cards
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-white font-semibold">+2, +4, +6, +10</p>
                <p className="text-gray-400">Draw cards. Can be stacked!</p>
              </div>
              <div>
                <p className="text-white font-semibold">Skip</p>
                <p className="text-gray-400">Skip next player</p>
              </div>
              <div>
                <p className="text-white font-semibold">Reverse</p>
                <p className="text-gray-400">Reverse direction</p>
              </div>
              <div>
                <p className="text-white font-semibold">Wild</p>
                <p className="text-gray-400">Change color</p>
              </div>
              <div>
                <p className="text-white font-semibold">Wild Reverse +4</p>
                <p className="text-gray-400">Reverse + draw 4 + change color</p>
              </div>
              <div>
                <p className="text-white font-semibold">Color Roulette</p>
                <p className="text-gray-400">Draw until chosen color appears</p>
              </div>
            </div>
          </div>

          {/* No Mercy Rules */}
          <div className="bg-red-900/20 rounded-xl p-3 border border-red-500/30">
            <h3 className="text-red-400 font-bold text-sm md:text-base mb-2 flex items-center gap-2">
              <span className="text-base md:text-lg">💀</span> No Mercy Rules
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-white font-semibold">Draw Stacking</p>
                <p className="text-gray-300">Stack draw cards! +4 on +2 = 6 cards!</p>
              </div>
              <div>
                <p className="text-white font-semibold">Mercy Rule (25 Cards)</p>
                <p className="text-gray-300">Reach 25 cards = eliminated</p>
              </div>
              <div>
                <p className="text-white font-semibold">Seven Swap</p>
                <p className="text-gray-300">Play 7 to swap hands with anyone</p>
              </div>
              <div>
                <p className="text-white font-semibold">Zero Pass</p>
                <p className="text-gray-300">Play 0 to pass all hands</p>
              </div>
            </div>
          </div>

          {/* Stacking Rules */}
          <div className="bg-orange-900/20 rounded-xl p-3 border border-orange-500/30">
            <h3 className="text-orange-400 font-bold text-sm md:text-base mb-2 flex items-center gap-2">
              <span className="text-base md:text-lg">📚</span> Stacking Rules
            </h3>
            <ul className="text-gray-300 text-xs space-y-1 list-disc list-inside">
              <li>On colored +2/+4: Stack same color OR wild draws</li>
              <li>On wild draws: Only stack other wild draws</li>
              <li>Example: +2🔴 → +4🔴 → +6⚪ → +10⚪ = Draw 22!</li>
              <li>Can't stack? Draw the penalty</li>
            </ul>
          </div>

          {/* UNO Rules */}
          <div className="bg-green-900/20 rounded-xl p-3 border border-green-500/30">
            <h3 className="text-green-400 font-bold text-sm md:text-base mb-2 flex items-center gap-2">
              <span className="text-base md:text-lg">🎉</span> UNO Call & Catch
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-white font-semibold">Calling UNO</p>
                <p className="text-gray-300">MUST call before playing when at 2 cards</p>
              </div>
              <div>
                <p className="text-white font-semibold">Catch UNO</p>
                <p className="text-gray-300">Catch players who didn't call UNO</p>
              </div>
              <div>
                <p className="text-gray-400 italic">Penalty: Draw 2 cards</p>
              </div>
            </div>
          </div>

          {/* Alliance Mode */}
          <div className="bg-purple-900/20 rounded-xl p-3 border border-purple-500/30">
            <h3 className="text-purple-400 font-bold text-sm md:text-base mb-2 flex items-center gap-2">
              <span className="text-base md:text-lg">🤝</span> Alliance Mode
            </h3>
            <ul className="text-gray-300 text-xs space-y-1 list-disc list-inside">
              <li>Team up with players</li>
              <li>See teammates' cards</li>
              <li>Coordinate strategies</li>
              <li>Win when any member finishes</li>
            </ul>
          </div>

          {/* Quick Tips */}
          <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-600/30">
            <h3 className="text-gray-300 font-bold text-sm md:text-base mb-2 flex items-center gap-2">
              <span className="text-base md:text-lg">💡</span> Quick Tips
            </h3>
            <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
              <li>Watch the timer - auto-play at 0!</li>
              <li>Remember to call UNO early</li>
              <li>Stack draws strategically</li>
              <li>Keep track of other players' cards</li>
              <li>Use wild cards wisely</li>
            </ul>
          </div>

        </div>
      </div>
    </>
  );
}
