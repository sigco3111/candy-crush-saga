import React from 'react';

interface GameOverModalProps {
  score: number;
  onPlayAgain: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ score, onPlayAgain }) => {
  const scoreStr = score.toLocaleString('en-US');
  const len = scoreStr.length;
  let scoreTextSize = 'text-7xl';

  if (len > 8) { // 9 chars or more e.g. 1,000,000
    scoreTextSize = 'text-5xl';
  } else if (len > 6) { // 7-8 chars e.g. 100,000
    scoreTextSize = 'text-6xl';
  }

  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl shadow-2xl p-8 text-center text-white transform scale-100 transition-transform duration-300 ease-in-out">
        <h2 className="text-6xl font-black mb-4" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.2)' }}>Game Over!</h2>
        <p className="text-2xl mb-2">Your Final Score:</p>
        <p className={`${scoreTextSize} font-black mb-8`} style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.2)' }}>{scoreStr}</p>
        <button
          onClick={onPlayAgain}
          className="bg-white text-pink-500 font-bold py-3 px-8 rounded-full text-xl shadow-lg hover:bg-pink-100 transform hover:scale-105 transition-all duration-200"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;