import React from 'react';

interface GameInfoProps {
  score: number;
  movesLeft: number;
}

const InfoCard: React.FC<{ title: string; value: number | string }> = ({ title, value }) => {
    const valueStr = String(value);
    
    let textSize = 'text-5xl';
    const len = valueStr.length;
    // String length includes commas, which is what we want for layout
    if (len > 10) { // e.g., 100,000,000 (11 chars)
        textSize = 'text-2xl';
    } else if (len > 8) { // e.g., 1,000,000 (9 chars)
        textSize = 'text-3xl';
    } else if (len > 6) { // e.g., 100,000 (7 chars)
        textSize = 'text-4xl';
    }

    return (
        <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-xl shadow-lg p-4 text-center h-full flex flex-col justify-center border-2 border-white/50">
            <h3 className="text-xl font-bold text-pink-700">{title}</h3>
            <p 
                className={`font-black text-pink-500 ${textSize}`} 
                style={{ 
                    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                    letterSpacing: title === 'Score' && valueStr.length > 6 ? '-0.05em' : 'normal',
                }}
            >
                {value}
            </p>
        </div>
    );
};

const GameInfo: React.FC<GameInfoProps> = ({ score, movesLeft }) => {
  return (
    <div className="w-full max-w-md mx-auto p-4 flex items-stretch gap-4">
      <div className="w-2/3">
          <InfoCard title="Score" value={score.toLocaleString('en-US')} />
      </div>
      <div className="w-1/3">
          <InfoCard title="Moves" value={movesLeft} />
      </div>
    </div>
  );
};

export default GameInfo;