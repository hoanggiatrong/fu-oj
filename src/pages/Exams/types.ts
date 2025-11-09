export interface ExamData {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    status: string;
    groups?: Array<{ id: string; name: string }>;
    exercises?: Array<{ id: string; title: string }>;
}

export interface ExamStatusInfo {
    status: 'draft' | 'upcoming' | 'ongoing' | 'completed';
    label: string;
    color: string;
}

export interface SelectOption {
    value: string;
    label: string;
}

