import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as http from '../../../lib/httpRequest';
import SubmissionsTabContent from './SubmissionsTabContent';

const SubmissionsTab = observer(() => {
    const { id } = useParams();
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [examRankings, setExamRankings] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            const url = `/exams?page=1&size=10&sort=createdTimestamp,desc&groupId=${id}`;
            console.log('[API] GET', url, '- Fetching exams for submissions, group:', id);
            http.get(url)
                .then((res) => {
                    console.log('[API] GET', url, '- Success:', res.data);
                    setExams(res.data?.content || res.data || []);
                })
                .catch((error) => {
                    console.error('[API] GET', url, '- Error:', error);
                    setExams([]);
                });
        }
    }, [id]);

    const handleExamChange = (examId: string) => {
        setSelectedExamId(examId);
        const url = `/exam-rankings?groupExamId=${examId}`;
        console.log('[API] GET', url, '- Fetching exam rankings for exam:', examId);
        http.get(url)
            .then((res) => {
                console.log('[API] GET', url, '- Success:', res.data);
                setExamRankings(res.data || []);
            })
            .catch((error) => {
                console.error('[API] GET', url, '- Error:', error);
                setExamRankings([]);
            });
    };

    return (
        <SubmissionsTabContent
            exams={exams}
            selectedExamId={selectedExamId}
            examRankings={examRankings}
            onExamChange={handleExamChange}
        />
    );
});

export default SubmissionsTab;
