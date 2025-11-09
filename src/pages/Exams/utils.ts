import dayjs from 'dayjs';
import type { ExamData, ExamStatusInfo } from './types';

export const getExamStatus = (startTime: string | null, endTime: string | null): ExamStatusInfo => {
    const now = dayjs();
    if (!startTime || !endTime) {
        return { status: 'draft', label: 'Chưa có lịch', color: 'default' };
    }
    
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    
    if (start.isAfter(now)) {
        return { status: 'upcoming', label: 'Sắp tới', color: 'blue' };
    } else if (start.isBefore(now) || start.isSame(now)) {
        if (end.isAfter(now)) {
            return { status: 'ongoing', label: 'Đang diễn ra', color: 'green' };
        } else {
            return { status: 'completed', label: 'Đã kết thúc', color: 'default' };
        }
    }
    
    return { status: 'draft', label: 'Chưa có lịch', color: 'default' };
};

export const filterDataByTab = (dataList: ExamData[], activeTab: string, search: string): ExamData[] => {
    const now = dayjs();
    let filtered = dataList;

    switch (activeTab) {
        case 'upcoming':
            filtered = dataList.filter((data) => {
                const startTime = data.startTime ? dayjs(data.startTime) : null;
                return startTime && startTime.isAfter(now);
            });
            break;
        case 'ongoing':
            filtered = dataList.filter((data) => {
                const startTime = data.startTime ? dayjs(data.startTime) : null;
                const endTime = data.endTime ? dayjs(data.endTime) : null;
                return (
                    startTime &&
                    endTime &&
                    (startTime.isBefore(now) || startTime.isSame(now)) &&
                    endTime.isAfter(now)
                );
            });
            break;
        case 'completed':
            filtered = dataList.filter((data) => {
                const endTime = data.endTime ? dayjs(data.endTime) : null;
                return endTime && endTime.isBefore(now);
            });
            break;
        case 'all':
        default:
            filtered = dataList;
            break;
    }

    // Apply search filter
    if (search) {
        filtered = filtered.filter(
            (data: ExamData) =>
                (data?.title || '').toLowerCase().includes(search.toLowerCase()) ||
                (data?.description || '').toLowerCase().includes(search.toLowerCase())
        );
    }

    return filtered;
};

