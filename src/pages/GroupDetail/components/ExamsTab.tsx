import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as http from '../../../lib/httpRequest';
import globalStore from '../../../components/GlobalComponent/globalStore';
import authentication from '../../../shared/auth/authentication';
import routesConfig from '../../../routes/routesConfig';
import { getExamStatus } from '../../Exams/utils';
import ConfirmStartExamModal from '../../Exams/components/ConfirmStartExamModal';
import SubmissionDetailModal, {
    type SubmissionResult as SubmissionSummary
} from './GroupExamDetail/SubmissionDetailModal';
import ExamsTable from './ExamsTable';

interface Exam {
    id: string;
    groupExamId?: string;
    title: string;
    description?: string;
    startTime?: string | null;
    endTime?: string | null;
    status?: string;
    timeLimit?: number | null;
}

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

interface ExamRankingItem {
    completed: boolean;
    groupExam?: {
        groupExamId: string;
        examId: string;
    };
}

const normalizeGroupExamData = (data: GroupExamItem[] = []): Exam[] =>
    data.map((item) => ({
        id: item.exam?.id || item.groupExamId || item.id,
        groupExamId: item.groupExamId || item.id,
        title: item.exam?.title || item.exam?.code || 'Bài thi',
        description: item.exam?.description || '',
        startTime: item.exam?.startTime || null,
        endTime: item.exam?.endTime || null,
        status: item.status || undefined,
        timeLimit: item.exam?.timeLimit ?? null
    }));

const ExamsTab = observer(() => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [selectedExamRecord, setSelectedExamRecord] = useState<Exam | null>(null);
    const [isSubmissionDetailModalOpen, setSubmissionDetailModalOpen] = useState(false);
    const [submissionDetailData, setSubmissionDetailData] = useState<SubmissionSummary | null>(null);
    const [loadingSubmissionDetail, setLoadingSubmissionDetail] = useState(false);
    const [examRankingsMap, setExamRankingsMap] = useState<Map<string, ExamRankingItem>>(new Map());
    const currentUserId = authentication.account?.data?.id;
    const isInstructor = authentication.isInstructor;

    useEffect(() => {
        if (!id) {
            setExams([]);
            return;
        }

        const url = `/group-exams?groupId=${id}`;
        console.log('[API] GET', url, '- Fetching exams for group:', id);
        setLoading(true);
        http.get(url)
            .then((res) => {
                const data = res.data || [];
                setExams(normalizeGroupExamData(data));
            })
            .catch((error) => {
                console.error('[API] GET', url, '- Error:', error);
                setExams([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        if (isInstructor) {
            setExamRankingsMap(new Map());
            return;
        }

        if (!currentUserId) {
            setExamRankingsMap(new Map());
            return;
        }

        http.get(`/exam-rankings?userId=${currentUserId}`)
            .then((res) => {
                const map = new Map<string, ExamRankingItem>();
                (res.data || []).forEach((rank: ExamRankingItem) => {
                    const examId = rank?.groupExam?.examId;
                    if (examId) {
                        map.set(examId, rank);
                    }
                });
                setExamRankingsMap(map);
            })
            .catch((error) => {
                console.error('Error fetching exam rankings:', error);
                setExamRankingsMap(new Map());
            });
    }, [isInstructor, currentUserId]);

    const handleConfirmStartExam = async () => {
        if (!selectedExamId) return;

        try {
            if (!currentUserId) {
                globalStore.triggerNotification('error', 'Không tìm thấy thông tin người dùng!', '');
                setConfirmModalOpen(false);
                setSelectedExamId(null);
                setSelectedExamRecord(null);
                return;
            }

            let numberOfExercises = 0;
            if (selectedExamRecord) {
                try {
                    const examRes = await http.get(`/exams/${selectedExamId}`);
                    numberOfExercises = examRes.data?.exercises?.length || 0;
                } catch (err) {
                    console.error('Error fetching exam detail:', err);
                }
            }

            await http.post('/exam-rankings', {
                groupExamId: selectedExamRecord?.groupExamId || selectedExamId,
                userId: currentUserId,
                numberOfExercises,
                completed: false
            });

            setConfirmModalOpen(false);
            setSelectedExamId(null);
            setSelectedExamRecord(null);
            navigate(`/${routesConfig.exam}`.replace(':id', selectedExamId));
        } catch (error) {
            const errorMessage =
                (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Có lỗi xảy ra khi bắt đầu làm bài!';
            globalStore.triggerNotification('error', errorMessage, '');
            setConfirmModalOpen(false);
            setSelectedExamId(null);
            setSelectedExamRecord(null);
        }
    };

    const openSubmissionDetailModal = async (userId: string, examId: string) => {
        setLoadingSubmissionDetail(true);
        setSubmissionDetailData(null);
        try {
            const res = await http.get(`/exams/submissions/results?userId=${userId}&examId=${examId}`);
            const detail = (res && typeof res === 'object' && 'data' in res ? (res as { data: SubmissionSummary }).data : res) as SubmissionSummary | null;
            if (detail) {
                setSubmissionDetailData(detail);
                setSubmissionDetailModalOpen(true);
                return true;
            }
            globalStore.triggerNotification('info', 'Bài thi đã kết thúc và bạn chưa tham gia!', '');
            return false;
        } catch (error) {
            console.error('Error fetching submission detail:', error);
            globalStore.triggerNotification('info', 'Bài thi đã kết thúc và bạn chưa tham gia!', '');
            return false;
        } finally {
            setLoadingSubmissionDetail(false);
        }
    };

    const handleStudentExamClick = async (record: Exam) => {
        if (!currentUserId) {
            globalStore.triggerNotification('error', 'Không tìm thấy thông tin người dùng!', '');
            return;
        }

        const examStatus = getExamStatus(record.startTime ?? null, record.endTime ?? null);

        if (examStatus.status === 'completed') {
            await openSubmissionDetailModal(currentUserId, record.id);
            return;
        }

        try {
            const res = await http.get(`/exam-rankings?userId=${currentUserId}&examId=${record.id}`);
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                const rankingRecord = res.data[0];
                if (rankingRecord.completed) {
                    await openSubmissionDetailModal(currentUserId, record.id);
                    return;
                }

                navigate(`/${routesConfig.exam}`.replace(':id', record.id));
                return;
            }

            setSelectedExamId(record.id);
            setSelectedExamRecord(record);
            setConfirmModalOpen(true);
        } catch (error) {
            console.error('Error checking exam ranking:', error);
            setSelectedExamId(record.id);
            setSelectedExamRecord(record);
            setConfirmModalOpen(true);
        }
    };

    const studentStatusMap =
        !isInstructor
            ? new Map<string, 'not-started' | 'in-progress' | 'completed'>(
                  exams.map((exam) => {
                      const ranking = examRankingsMap.get(exam.id);
                      if (!ranking) {
                          return [exam.id, 'not-started'];
                      }
                      return [exam.id, ranking.completed ? 'completed' : 'in-progress'];
                  })
              )
            : undefined;

    return (
        <>
            <ExamsTable
                dataSource={exams}
                loading={loading}
                groupId={id}
                showStatisticsAction={isInstructor}
                onExamClick={!isInstructor ? handleStudentExamClick : undefined}
                studentStatusMap={studentStatusMap}
            />
            <ConfirmStartExamModal
                open={confirmModalOpen}
                onCancel={() => {
                    setConfirmModalOpen(false);
                    setSelectedExamId(null);
                    setSelectedExamRecord(null);
                }}
                onConfirm={handleConfirmStartExam}
                examRecord={selectedExamRecord}
            />
            <SubmissionDetailModal
                open={isSubmissionDetailModalOpen}
                onCancel={() => {
                    setSubmissionDetailModalOpen(false);
                    setSubmissionDetailData(null);
                }}
                submissionResult={submissionDetailData}
                loading={loadingSubmissionDetail}
            />
        </>
    );
});

export default ExamsTab;

