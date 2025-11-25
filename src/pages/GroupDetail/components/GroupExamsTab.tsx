import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as http from '../../../lib/httpRequest';
import ExamsTable from './ExamsTable';

interface GroupExamItem {
    id: string;
    groupExamId: string;
    status?: string;
    exam?: {
        id: string;
        code?: string;
        title?: string;
        description?: string;
        startTime?: string;
        endTime?: string;
        timeLimit?: number | null;
    };
}

const normalizeGroupExamData = (data: GroupExamItem[] = []) =>
    data.map((item) => ({
        id: item.exam?.id || item.groupExamId || item.id,
        title: item.exam?.title || item.exam?.code || 'Bài thi',
        description: item.exam?.description || '',
        startTime: item.exam?.startTime || null,
        endTime: item.exam?.endTime || null,
        status: item.status || undefined,
        timeLimit: item.exam?.timeLimit ?? null
    }));

const GroupExamsTab = observer(() => {
    const { id } = useParams();
    const [groupExams, setGroupExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!id) {
            setGroupExams([]);
            return;
        }

        const url = `/group-exams?groupId=${id}`;
        console.log('[API] GET', url, '- Fetching group exams for group:', id);
        setLoading(true);
        http.get(url)
            .then((res) => {
                const data = res.data || [];
                setGroupExams(normalizeGroupExamData(data));
            })
            .catch((error) => {
                console.error('[API] GET', url, '- Error:', error);
                setGroupExams([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    return <ExamsTable dataSource={groupExams} loading={loading} />;
});

export default GroupExamsTab;

