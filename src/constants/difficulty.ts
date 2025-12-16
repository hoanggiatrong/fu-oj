export const DIFFICULTY = 'Độ khó';

export const difficulties = {
    EASY: {
        text: 'Dễ',
        className: 'color-cyan',
        bgClassName: 'bg-cyan'
    },
    MEDIUM: {
        text: 'Trung bình',
        className: 'color-gold',
        bgClassName: 'bg-gold'
    },
    HARD: {
        text: 'Khó',
        className: 'color-red',
        bgClassName: 'bg-red'
    }
} as const;

export type Difficulty = keyof typeof difficulties;
