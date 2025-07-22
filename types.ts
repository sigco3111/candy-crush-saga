import { CANDY_VARIETY } from './constants';

export type CandyType = typeof CANDY_VARIETY[number];
export type SpecialType = 'striped-h' | 'striped-v';
export type CandyObject = {
    type: CandyType;
    special: SpecialType | null;
    id: string;
};
export type Board = (CandyObject | null)[][];
export type GameStatus = 'playing' | 'gameOver';

export type ScorePopupInfo = {
    id: string;
    score: number;
    row: number;
    col: number;
};

export type ParticleInfo = {
    id: string;
    color: string;
    row: number;
    col: number;
};