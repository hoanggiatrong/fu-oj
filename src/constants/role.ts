export const roles = {
    ADMIN: 'Admin',
    INSTRUCTOR: 'Giảng viên',
    STUDENT: 'Sinh viên'
} as const;

export type Role = keyof typeof roles;
