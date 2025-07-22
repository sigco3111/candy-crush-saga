
import React, { useState, useEffect, useCallback, DragEvent } from 'react';
import { BOARD_SIZE, CANDY_VARIETY, INITIAL_MOVES, POINTS_PER_CANDY, CANDY_COLORS } from './constants';
import type { Board, CandyType, GameStatus, CandyObject, SpecialType, ScorePopupInfo, ParticleInfo } from './types';
import GameInfo from './components/GameInfo';
import GameOverModal from './components/GameOverModal';

let candyIdCounter = 0;

type VisualEffect = {
    id: string;
    type: 'laser-h' | 'laser-v';
    row: number;
    col: number;
};

const COMBO_MESSAGES = ["Sweet!", "Tasty!", "Delicious!", "Divine!"];

const ScorePopup: React.FC<{ score: number; onComplete: () => void }> = ({ score, onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 800);
        return () => clearTimeout(timer);
    }, [onComplete]);
    return <div className="score-popup-animation pointer-events-none">+{score}</div>;
};

const ParticleEffect: React.FC<{ color: string; onComplete: () => void }> = ({ color, onComplete }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 800);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="particle"
                    style={{
                        backgroundColor: color,
                        '--x': `${(Math.random() - 0.5) * 60}px`,
                        '--y': `${(Math.random() - 0.5) * 60}px`,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
};


const App: React.FC = () => {
    const [board, setBoard] = useState<Board>([]);
    const [score, setScore] = useState<number>(0);
    const [movesLeft, setMovesLeft] = useState<number>(INITIAL_MOVES);
    const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
    const [isProcessing, setIsProcessing] = useState<boolean>(true);

    const [candyBeingDragged, setCandyBeingDragged] = useState<HTMLDivElement | null>(null);
    const [candyBeingReplaced, setCandyBeingReplaced] = useState<HTMLDivElement | null>(null);
    const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
    const [animationMap, setAnimationMap] = useState<Map<string, string>>(new Map());
    const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);
    const [invalidSwapCells, setInvalidSwapCells] = useState<string[] | null>(null);
    const [scorePopups, setScorePopups] = useState<ScorePopupInfo[]>([]);
    const [particleEffects, setParticleEffects] = useState<ParticleInfo[]>([]);
    const [comboCount, setComboCount] = useState(0);
    const [comboMessage, setComboMessage] = useState<{ id: string; text: string } | null>(null);


    const createBoard = useCallback((): Board => {
        const newBoard: Board = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
            const row: (CandyObject | null)[] = [];
            for (let j = 0; j < BOARD_SIZE; j++) {
                let newCandyType: CandyType;
                do {
                    newCandyType = CANDY_VARIETY[Math.floor(Math.random() * CANDY_VARIETY.length)];
                } while (
                    (j >= 2 && row[j - 1]?.type === newCandyType && row[j - 2]?.type === newCandyType) ||
                    (i >= 2 && newBoard[i - 1][j]?.type === newCandyType && newBoard[i - 2][j]?.type === newCandyType)
                );
                 row.push({ type: newCandyType, special: null, id: `candy-${candyIdCounter++}` });
            }
            newBoard.push(row);
        }
        return newBoard;
    }, []);
    
    const resetGame = useCallback(() => {
        setBoard(createBoard());
        setScore(0);
        setMovesLeft(INITIAL_MOVES);
        setGameStatus('playing');
        setIsProcessing(false);
        setClearingCells(new Set());
        setVisualEffects([]);
        setScorePopups([]);
        setParticleEffects([]);
        setComboCount(0);
        setComboMessage(null);
    }, [createBoard]);

    useEffect(() => {
        resetGame();
    }, [resetGame]);

    const findMatches = useCallback((currentBoard: Board): Set<string> => {
        const matchedCells = new Set<string>();
        if (!currentBoard.length) return matchedCells;
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const candy = currentBoard[i][j];
                if (!candy) continue;
                // Horizontal
                if (j < BOARD_SIZE - 2 && currentBoard[i][j+1]?.type === candy.type && currentBoard[i][j+2]?.type === candy.type) {
                    const match = [`${i},${j}`, `${i},${j+1}`, `${i},${j+2}`];
                    let k = j + 3;
                    while (k < BOARD_SIZE && currentBoard[i][k]?.type === candy.type) {
                        match.push(`${i},${k}`);
                        k++;
                    }
                    match.forEach(cell => matchedCells.add(cell));
                }
                // Vertical
                if (i < BOARD_SIZE - 2 && currentBoard[i+1][j]?.type === candy.type && currentBoard[i+2][j]?.type === candy.type) {
                    const match = [`${i},${j}`, `${i+1},${j}`, `${i+2},${j}`];
                    let k = i + 3;
                    while (k < BOARD_SIZE && currentBoard[k][j]?.type === candy.type) {
                        match.push(`${k},${j}`);
                        k++;
                    }
                    match.forEach(cell => matchedCells.add(cell));
                }
            }
        }
        return matchedCells;
    }, []);
    
    const onDragStart = (e: DragEvent<HTMLDivElement>) => setCandyBeingDragged(e.target as HTMLDivElement);
    const onDrop = (e: DragEvent<HTMLDivElement>) => setCandyBeingReplaced(e.target as HTMLDivElement);

    const onDragEnd = useCallback(async () => {
        if (!candyBeingDragged || !candyBeingReplaced || isProcessing) {
             setCandyBeingDragged(null);
             setCandyBeingReplaced(null);
             return;
        }

        const startRow = parseInt(candyBeingDragged.dataset.row || '0');
        const startCol = parseInt(candyBeingDragged.dataset.col || '0');
        const endRow = parseInt(candyBeingReplaced.dataset.row || '0');
        const endCol = parseInt(candyBeingReplaced.dataset.col || '0');

        const candy1 = board[startRow]?.[startCol];
        const candy2 = board[endRow]?.[endCol];

        const isAdjacent = Math.abs(startRow - endRow) + Math.abs(startCol - endCol) === 1;

        if (!isAdjacent || !candy1 || !candy2) {
            setCandyBeingDragged(null);
            setCandyBeingReplaced(null);
            return;
        }
        
        setComboCount(0); // Reset combo on new move

        const testBoard = board.map(r => r.map(c => c ? {...c} : null));
        const temp = testBoard[startRow][startCol];
        testBoard[startRow][startCol] = testBoard[endRow][endCol];
        testBoard[endRow][endCol] = temp;
        
        const matches = findMatches(testBoard);
        
        if (matches.size > 0) {
            setBoard(testBoard);
            setMovesLeft(prev => prev - 1);
            setIsProcessing(true);
        } else {
            setInvalidSwapCells([`${startRow},${startCol}`, `${endRow},${endCol}`]);
            setTimeout(() => setInvalidSwapCells(null), 300);
        }
        
        setCandyBeingDragged(null);
        setCandyBeingReplaced(null);
    }, [candyBeingDragged, candyBeingReplaced, isProcessing, board, findMatches]);

    useEffect(() => {
        if (movesLeft <= 0 && gameStatus === 'playing' && !isProcessing) {
            setGameStatus('gameOver');
        }
    }, [movesLeft, gameStatus, isProcessing]);
    
    useEffect(() => {
        if (comboMessage) {
            const timer = setTimeout(() => {
                setComboMessage(null);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [comboMessage]);

    useEffect(() => {
        if (isProcessing) {
            const processBoard = async () => {
                if (!board.length || !board[0].length) {
                    setIsProcessing(false);
                    return;
                }

                let currentBoard = board.map(r => r.map(c => c ? {...c} : null));

                const horizontalMatches: string[][] = [];
                const verticalMatches: string[][] = [];

                for (let i = 0; i < BOARD_SIZE; i++) {
                    for (let j = 0; j < BOARD_SIZE - 2; j++) {
                        const candy1 = currentBoard[i][j];
                        if (candy1 && currentBoard[i][j+1]?.type === candy1.type && currentBoard[i][j+2]?.type === candy1.type) {
                            let k = j;
                            const currentMatch = [];
                            while(k < BOARD_SIZE && currentBoard[i][k]?.type === candy1.type) {
                                currentMatch.push(`${i},${k}`);
                                k++;
                            }
                            if(currentMatch.length > 2) horizontalMatches.push(currentMatch);
                            j = k - 1;
                        }
                    }
                }

                for (let j = 0; j < BOARD_SIZE; j++) {
                    for (let i = 0; i < BOARD_SIZE - 2; i++) {
                        const candy1 = currentBoard[i][j];
                        if (candy1 && currentBoard[i+1][j]?.type === candy1.type && currentBoard[i+2][j]?.type === candy1.type) {
                            let k = i;
                            const currentMatch = [];
                            while(k < BOARD_SIZE && currentBoard[k][j]?.type === candy1.type) {
                                currentMatch.push(`${k},${j}`);
                                k++;
                            }
                             if(currentMatch.length > 2) verticalMatches.push(currentMatch);
                            i = k - 1;
                        }
                    }
                }

                const allMatches = [...horizontalMatches, ...verticalMatches];
                if (allMatches.length === 0 && !board.some(r => r.some(c => c === null))) {
                    setAnimationMap(new Map());
                    setIsProcessing(false);
                    setComboCount(0); // Reset combo when chain ends
                    return;
                }

                const initialCellsToClear = new Set<string>();
                const specialCreations: {pos: string, special: SpecialType, type: CandyType}[] = [];
                
                allMatches.forEach(match => {
                    match.forEach(cell => initialCellsToClear.add(cell));
                    const randPos = match[Math.floor(Math.random() * match.length)];
                    const [r, c] = randPos.split(',').map(Number);
                    const candyType = board[r][c]!.type;

                    if (match.length === 4) {
                         const isHorizontal = board[r][c+1] !== undefined && match.includes(`${r},${c+1}`);
                         specialCreations.push({ pos: randPos, special: isHorizontal ? 'striped-h' : 'striped-v', type: candyType });
                    }
                });
                
                let cellsToClear = new Set<string>(initialCellsToClear);
                let processedSpecials = new Set<string>();
                const newVisualEffects: VisualEffect[] = [];
                
                while (true) {
                    const specialsInClearSet = Array.from(cellsToClear).filter(pos => {
                        const [r, c] = pos.split(',').map(Number);
                        return currentBoard[r]?.[c]?.special && !processedSpecials.has(pos);
                    });

                    if (specialsInClearSet.length === 0) break;

                    specialsInClearSet.forEach(pos => {
                        processedSpecials.add(pos);
                        const [r, c] = pos.split(',').map(Number);
                        const candy = currentBoard[r][c];

                        if (candy?.special === 'striped-h') {
                            newVisualEffects.push({ id: `effect-${Date.now()}-${r}-${c}`, type: 'laser-h', row: r, col: c });
                            for (let j = 0; j < BOARD_SIZE; j++) cellsToClear.add(`${r},${j}`);
                        } else if (candy?.special === 'striped-v') {
                            newVisualEffects.push({ id: `effect-${Date.now()}-${r}-${c}`, type: 'laser-v', row: r, col: c });
                            for (let i = 0; i < BOARD_SIZE; i++) cellsToClear.add(`${i},${c}`);
                        }
                    });
                }

                if (newVisualEffects.length > 0) {
                    setVisualEffects(prev => [...prev, ...newVisualEffects]);
                }
                if (cellsToClear.size > 0) {
                    const newComboCount = comboCount + 1;
                    setComboCount(newComboCount);

                    if (newComboCount > 1) {
                         const messageText = COMBO_MESSAGES[Math.min(newComboCount - 2, COMBO_MESSAGES.length - 1)];
                         setComboMessage({ id: `combo-${Date.now()}`, text: messageText });
                    }
                    
                    setScore(prev => prev + cellsToClear.size * POINTS_PER_CANDY);
                    
                    const newParticles: ParticleInfo[] = [];
                    const newScorePopups: ScorePopupInfo[] = [];
                    cellsToClear.forEach(cellPos => {
                        const [r, c] = cellPos.split(',').map(Number);
                        const candy = currentBoard[r]?.[c];
                        if (candy) {
                             newParticles.push({ id: `p-${Date.now()}-${r}-${c}`, color: CANDY_COLORS[candy.type], row: r, col: c });
                             newScorePopups.push({ id: `sp-${Date.now()}-${r}-${c}`, score: POINTS_PER_CANDY, row: r, col: c });
                        }
                    });
                    setParticleEffects(prev => [...prev, ...newParticles]);
                    setScorePopups(prev => [...prev, ...newScorePopups]);

                    setClearingCells(cellsToClear);
                }
                
                await new Promise(resolve => setTimeout(resolve, 300));
                setVisualEffects([]);
                
                let boardAfterClear = currentBoard;
                cellsToClear.forEach(cell => {
                    const [r, c] = cell.split(',').map(Number);
                    boardAfterClear[r][c] = null;
                });

                specialCreations.forEach(({pos, special, type}) => {
                    if (cellsToClear.has(pos)) {
                        const [r, c] = pos.split(',').map(Number);
                        boardAfterClear[r][c] = { type, special, id: `candy-${candyIdCounter++}`};
                    }
                });

                setClearingCells(new Set());
                
                const boardAfterDrop: Board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
                for (let j = 0; j < BOARD_SIZE; j++) {
                    let newRow = BOARD_SIZE - 1;
                    for (let i = BOARD_SIZE - 1; i >= 0; i--) {
                        if (boardAfterClear[i][j]) {
                            boardAfterDrop[newRow][j] = boardAfterClear[i][j];
                            newRow--;
                        }
                    }
                }

                const boardWithNewCandies = boardAfterDrop;
                const currentStepAnimations = new Map<string, string>();
                for (let i = 0; i < BOARD_SIZE; i++) {
                    for (let j = 0; j < BOARD_SIZE; j++) {
                        if (boardWithNewCandies[i][j] === null) {
                            const newCandy = {
                                type: CANDY_VARIETY[Math.floor(Math.random() * CANDY_VARIETY.length)],
                                special: null,
                                id: `candy-${candyIdCounter++}`
                            };
                            boardWithNewCandies[i][j] = newCandy
                            currentStepAnimations.set(newCandy.id, 'fall-in-animation');
                        }
                    }
                }
                
                setBoard(boardWithNewCandies);
                setAnimationMap(currentStepAnimations);
            };
            processBoard();
        }
    }, [isProcessing, board, comboCount]);

    const removeScorePopup = useCallback((id: string) => {
        setScorePopups(prev => prev.filter(p => p.id !== id));
    }, []);

    const removeParticleEffect = useCallback((id: string) => {
        setParticleEffects(prev => prev.filter(p => p.id !== id));
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-300 via-fuchsia-400 to-indigo-500 font-sans">
            <div className="bg-white/50 backdrop-blur-md rounded-3xl shadow-2xl p-6">
                <h1 
                    className="text-6xl font-black text-center text-white mb-4 drop-shadow-lg"
                    style={{textShadow: '3px 3px 0px rgba(0,0,0,0.15)'}}>
                        Candy Crush
                </h1>
                <GameInfo score={score} movesLeft={movesLeft} />
                <div className="mt-4 p-2 bg-pink-200/50 rounded-2xl shadow-inner relative">
                    {comboMessage && (
                        <div
                            key={comboMessage.id}
                            className="absolute inset-0 flex justify-center items-center pointer-events-none z-20"
                        >
                            <div className="combo-popup-animation text-6xl font-black text-white">
                                {comboMessage.text}
                            </div>
                        </div>
                    )}
                    <div className={`grid grid-cols-8 grid-rows-8 gap-1 w-80 h-80 md:w-96 md:h-96`}>
                        {board.map((row, rowIndex) => (
                            row.map((cell, colIndex) => {
                                const cellPos = `${rowIndex},${colIndex}`;
                                const isClearing = clearingCells.has(cellPos);
                                const isInvalid = invalidSwapCells?.includes(cellPos);
                                const popupsForCell = scorePopups.filter(p => p.row === rowIndex && p.col === colIndex);
                                const particlesForCell = particleEffects.filter(p => p.row === rowIndex && p.col === colIndex);

                                return (
                                <div
                                    key={cell?.id || `${rowIndex}-${colIndex}`}
                                    className="flex justify-center items-center rounded-lg bg-white/30 shadow-md relative"
                                >
                                    {cell && (
                                        <div
                                            data-row={rowIndex}
                                            data-col={colIndex}
                                            draggable={!isProcessing && gameStatus === 'playing'}
                                            onDragStart={onDragStart}
                                            onDragOver={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
                                            onDragEnter={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
                                            onDragLeave={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
                                            onDrop={onDrop}
                                            onDragEnd={onDragEnd}
                                            className={`w-full h-full flex justify-center items-center text-3xl md:text-4xl cursor-grab active:cursor-grabbing transition-transform duration-200 hover:scale-110 relative ${isClearing ? 'pop-animation' : ''} ${animationMap.get(cell.id) || ''} ${isInvalid ? 'wiggle-animation' : ''}`}
                                            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}
                                            >
                                            {cell.special && <div className={`striped-background ${cell.special === 'striped-h' ? 'striped-h' : 'striped-v'}`}></div>}
                                            {cell.type}
                                        </div>
                                    )}
                                    {/* Effects are now rendered inside each cell for perfect positioning */}
                                    {popupsForCell.map(popup => (
                                        <div key={popup.id} className="absolute inset-0 flex justify-center items-center pointer-events-none z-10">
                                            <ScorePopup score={popup.score} onComplete={() => removeScorePopup(popup.id)} />
                                        </div>
                                    ))}
                                    {particlesForCell.map(effect => (
                                        <div key={effect.id} className="absolute inset-0 flex justify-center items-center pointer-events-none z-10">
                                           <ParticleEffect color={effect.color} onComplete={() => removeParticleEffect(effect.id)} />
                                        </div>
                                    ))}
                                </div>
                            )})
                        ))}
                    </div>
                     {visualEffects.map(effect => (
                        <div key={effect.id} className="absolute pointer-events-none z-10" style={{ top: `${effect.row * 12.5}%`, left: `${effect.col * 12.5}%`, width: '12.5%', height: '12.5%'}}>
                           <div className="w-full h-full flex justify-center items-center">
                              <div className={effect.type === 'laser-h' ? 'laser-h-animation' : 'laser-v-animation'}></div>
                           </div>
                        </div>
                     ))}
                </div>
            </div>
            {gameStatus === 'gameOver' && <GameOverModal score={score} onPlayAgain={resetGame} />}
        </div>
    );
};

export default App;
