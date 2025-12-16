export const VISIBILITY = 'Hiển thị';

export const visbilities = {
    PUBLIC: {
        text: 'Công khai',
        className: 'color-cyan'
    },
    PRIVATE: {
        text: 'Riêng tư',
        className: 'color-gold'
    },
    DRAFT: {
        text: 'Bản nháp',
        className: 'color-red'
    }
} as const;

export type Visibility = keyof typeof visbilities;
