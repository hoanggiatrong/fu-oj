import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as http from '../../../lib/httpRequest';
import ExamsTable from './ExamsTable';

interface Exam {
    id: string;
    title: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
}

const ExamsTab = observer(() => {
    const { id } = useParams();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) {
            const url = `/exams?page=1&size=10&sort=createdTimestamp,desc&groupId=${id}`;
            console.log('[API] GET', url, '- Fetching exams for group:', id);
            setLoading(true);
            http.get(url)
                .then((res) => {
                    console.log('[API] GET', url, '- Success:', res.data);
                    setExams(res.data?.content || res.data || []);
                })
                .catch((error) => {
                    console.error('[API] GET', url, '- Error:', error);
                    setExams([]);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [id]);

    return <ExamsTable dataSource={exams} loading={loading} groupId={id} />;
});

export default ExamsTab;

