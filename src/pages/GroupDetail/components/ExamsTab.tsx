import { AppstoreAddOutlined, SearchOutlined } from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Form, Input } from 'antd';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import globalStore from '../../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../../components/LoadingOverlay/LoadingOverlay';
import ProtectedElement from '../../../components/ProtectedElement/ProtectedElement';
import * as http from '../../../lib/httpRequest';
import routesConfig from '../../../routes/routesConfig';
import authentication from '../../../shared/auth/authentication';
import ConfirmStartExamModal from '../../Exams/components/ConfirmStartExamModal';
import ExamFormModal from '../../Exams/components/ExamFormModal';
import type { SelectOption } from '../../Exams/types';
import { getExamStatus } from '../../Exams/utils';
import ExamsTable from './ExamsTable';
import SubmissionDetailModal, {
    type SubmissionResult as SubmissionSummary
} from './GroupExamDetail/SubmissionDetailModal';

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

// interface GroupExamItem {
//     id: string;
//     groupExamId: string;
//     status?: string;
//     exam?: {
//         id: string;
//         code?: string;
//         title?: string;
//         description?: string;
//         startTime?: string;
//         endTime?: string;
//         timeLimit?: number | null;
//     };
// }

interface ExamRankingItem {
    completed: boolean;
    groupExam?: {
        groupExamId: string;
        examId: string;
    };
}

const normalizeGroupExamData = (data: any[] = []): Exam[] =>
    data.map((item) => ({
        id: item.exam?.id || item.groupExamId || item.id,
        groupExamId: item.groupExamId || item.id,
        title: item.exam?.title || item.exam?.code || 'Bài thi',
        description: item.exam?.description || '',
        startTime: item.exam?.startTime || null,
        endTime: item.exam?.endTime || null,
        status: item.status || undefined,
        timeLimit: item.exam?.timeLimit ?? null,
        isExamined: item?.isExamined ?? null
    }));

const ExamsTab = observer(() => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [isExamModalOpen, setExamModalOpen] = useState(false);
    const [selectedExamRecord, setSelectedExamRecord] = useState<Exam | null>(null);
    const [isSubmissionDetailModalOpen, setSubmissionDetailModalOpen] = useState(false);
    const [submissionDetailData, setSubmissionDetailData] = useState<SubmissionSummary | null>(null);
    const [loadingSubmissionDetail, setLoadingSubmissionDetail] = useState(false);
    const [examRankingsMap, setExamRankingsMap] = useState<Map<string, ExamRankingItem>>(new Map());
    const [examExerciseOptions, setExamExerciseOptions] = useState<SelectOption[]>([]);
    const [examGroupOptions, setExamGroupOptions] = useState<SelectOption[]>([]);
    const currentUserId = authentication.account?.data?.id;
    const isInstructor = authentication.isInstructor;
    const [examForm] = Form.useForm();

    const getAllExercises = () => {
        http.get('/exercises?pageSize=999999')
            .then((res) => {
                let exercises = res.data || [];

                exercises = exercises.filter((e: any) => !(e.visibility == 'DRAFT') && e?.testCases?.length > 0);

                setExamExerciseOptions(
                    exercises.map((exercise: any) => ({
                        value: exercise.id,
                        label: exercise.title || exercise.code || '',
                        ...exercise
                    }))
                );
            })
            .catch((error) => {
                error;
                setExamExerciseOptions([]);
            });
    };

    const handleCreateGroupExam = () => {
        if (!id) return;
        examForm.resetFields();
        examForm.setFieldsValue({
            groupIds: [id]
        });
        setExamModalOpen(true);
    };

    const handleCloseExamModal = () => {
        examForm.resetFields();
        setExamModalOpen(false);
    };

    const handleGroupExamSubmit: FormProps['onFinish'] = (values) => {
        const startTime = values.startTime ? dayjs(values.startTime).utc().format('YYYY-MM-DDTHH:mm:ss[Z]') : null;
        const endTime = values.endTime ? dayjs(values.endTime).utc().format('YYYY-MM-DDTHH:mm:ss[Z]') : null;
        const groupIdsSet = new Set(values.groupIds || []);
        if (id) {
            groupIdsSet.add(id);
        }

        const payload = {
            title: values.title,
            description: values.description,
            startTime,
            endTime,
            timeLimit: values.timeLimit || null,
            status: 'DRAFT',
            groupIds: Array.from(groupIdsSet),
            exerciseIds: values.exerciseIds || []
        };

        http.post('/exams', payload)
            .then((res) => {
                globalStore.triggerNotification('success', res.message || 'Tạo bài thi thành công!', '');
                getGroupExams();
                handleCloseExamModal();
            })
            .catch((error) => {
                globalStore.triggerNotification('error', error.response?.data?.message || 'Có lỗi xảy ra!', '');
            });
    };

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
                groupExamId: selectedExamRecord?.groupExamId || '',
                userId: currentUserId,
                numberOfExercises,
                completed: false
            });

            setConfirmModalOpen(false);
            setSelectedExamId(null);
            setSelectedExamRecord(null);
            // LINK TO EXAM DETAIL PAGE
            console.log('selectedExamRecord?.groupExamId', selectedExamRecord?.groupExamId);
            navigate(`/${routesConfig.exam}`.replace(':groupExamId', selectedExamRecord?.groupExamId || ''));
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
            const detail = (
                res && typeof res === 'object' && 'data' in res ? (res as { data: SubmissionSummary }).data : res
            ) as SubmissionSummary | null;
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
            const res = await http.get(`/exam-rankings?userId=${currentUserId}&groupExamId=${record.groupExamId}`);
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                const rankingRecord = res.data[0];
                if (rankingRecord.completed) {
                    await openSubmissionDetailModal(currentUserId, record.id);
                    return;
                }

                if (rankingRecord?.groupExam?.groupExamId) {
                    navigate(
                        `/${routesConfig.exam}`.replace(
                            ':groupExamId',
                            rankingRecord?.groupExam?.groupExamId || 'hello'
                        )
                    );
                    return;
                }

                globalStore.triggerNotification('error', 'Không tìm thấy thông tin bài kiểm tra!', '');
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

    const studentStatusMap = !isInstructor
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

    useEffect(() => {
        getAllExercises();
    }, []);

    useEffect(() => {
        if (!id || !isExamModalOpen) return;
        examForm.setFieldsValue({
            groupIds: [id]
        });
    }, [id, isExamModalOpen, examForm]);

    useEffect(() => {
        if (!id) return;

        http.get(`/groups/${id}`).then((res) => {
            console.log('log:', res);
            setExamGroupOptions([
                {
                    value: res.data.id,
                    label: res.data.name
                }
            ]);
        });
    }, [id]);

    useEffect(() => {
        if (!id) {
            setExams([]);
            return;
        }

        getGroupExams();
    }, [id]);

    const getGroupExams = () => {
        const url = `/group-exams?groupId=${id}`;
        console.log('[API] GET', url, '- Fetching exams for group:', id);
        setLoading(true);
        http.get(url)
            .then((res) => {
                const data = res.data?.filter((d: any) => !d.deletedTimestamp) || [];
                setExams(normalizeGroupExamData(data));
            })
            .catch((error) => {
                console.error('[API] GET', url, '- Error:', error);
                setExams([]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

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

    return (
        <>
            <div className="leetcode mt-16">
                <div
                    className={classnames('wrapper max-width flex flex-1', {
                        'flex-col wrapper-responsive': globalStore.windowSize.width < 1300,
                        'pr-16': globalStore.windowSize.width > 1300
                    })}
                >
                    <div className="filters">
                        <Input
                            placeholder="Tìm kiếm bài thi"
                            // onChange={(e) => setSearch(e.target.value)}
                            data-tourid="search-input"
                            prefix={<SearchOutlined />}
                        />
                        <div className="group-create">
                            <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                                <div
                                    className="custom-btn-ico"
                                    onClick={handleCreateGroupExam}
                                    data-tourid="create-btn"
                                >
                                    <AppstoreAddOutlined className="custom-ant-ico color-cyan" />
                                    Tạo bài kiểm tra cho nhóm
                                </div>
                            </ProtectedElement>
                        </div>
                    </div>
                    <div className="body">
                        <LoadingOverlay loading={loading}>
                            <ExamsTable
                                dataSource={exams}
                                loading={loading}
                                groupId={id}
                                showStatisticsAction={isInstructor}
                                onExamClick={!isInstructor ? handleStudentExamClick : undefined}
                                studentStatusMap={studentStatusMap}
                            />
                        </LoadingOverlay>
                    </div>
                </div>
            </div>
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
            <ExamFormModal
                open={isExamModalOpen}
                updateId={null}
                editingRecord={null}
                groups={examGroupOptions}
                exercises={examExerciseOptions}
                onFinish={handleGroupExamSubmit}
                form={examForm}
                setUpdateId={(_id) => undefined}
                setEditingRecord={(_record) => undefined}
                onCancel={handleCloseExamModal}
            />
        </>
    );
});

export default ExamsTab;
