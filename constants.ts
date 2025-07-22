

export const BOARD_SIZE = 8;
export const CANDY_VARIETY = ['🍬', '🍭', '🍫', '🍩', '🍪', '🍇'] as const;
export const INITIAL_MOVES = 50;
export const POINTS_PER_CANDY = 10;

export const CANDY_COLORS: { [key in typeof CANDY_VARIETY[number]]: string } = {
    '🍬': '#8de2f2', // Light Blue
    '🍭': '#f76a8c', // Pink/Red
    '🍫': '#7b4f2c', // Brown
    '🍩': '#ff9bde', // Pink Frosting
    '🍪': '#d4a15f', // Sandy Brown
    '🍇': '#a176f2'  // Purple
};