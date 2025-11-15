import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as http from '../../../lib/httpRequest';
import ExamsTable from './ExamsTable';

const GroupExamsTab = observer(() => {
    const { id } = useParams();
    const [groupExams, setGroupExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) {
            const url = `/exams?page=1&size=10&sort=createdTimestamp,desc&groupId=${id}`;
            console.log('[API] GET', url, '- Fetching group exams for group:', id);
            setLoading(true);
            http.get(url)
                .then((res) => {
                    console.log('[API] GET', url, '- Success:', res.data);
                    const examData = res.data?.content || res.data || [];
                    setGroupExams(examData);
                })
                .catch((error) => {
                    console.error('[API] GET', url, '- Error:', error);
                    setGroupExams([]);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [id]);

    return <ExamsTable dataSource={groupExams} loading={loading} />;
});

export default GroupExamsTab;

