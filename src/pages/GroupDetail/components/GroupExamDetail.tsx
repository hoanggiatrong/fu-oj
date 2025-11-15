import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Breadcrumb, Card, Tag, Tabs } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as http from '../../../lib/httpRequest';
import routesConfig from '../../../routes/routesConfig';
import LoadingOverlay from '../../../components/LoadingOverlay/LoadingOverlay';
import globalStore from '../../../components/GlobalComponent/globalStore';

interface Exam {
    id: string;
    title: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    status?: string;
}

interface Group {
    id: string;
    name: string;
    code?: string;
}

const getExamStatus = (startTime: string | null | undefined, endTime: string | null | undefined) => {
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

const GroupExamDetail = observer(() => {
    const params = useParams();
    // Route là group/:id/exams/:examId, nên param name là 'id', không phải 'groupId'
    const groupId = params.id || params.groupId;
    const examId = params.examId;
    const navigate = useNavigate();
    const location = useLocation();
    const [exam, setExam] = useState<Exam | null>(null);
    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (examId) {
            setLoading(true);
            const url = `/exams/${examId}`;
            console.log('[API] GET', url, '- Fetching exam detail:', examId);
            http.get(url)
                .then((res) => {
                    console.log('[API] GET', url, '- Success:', res.data);
                    setExam(res.data || null);
                })
                .catch((error) => {
                    console.error('[API] GET', url, '- Error:', error);
                    globalStore.triggerNotification('error', 'Không thể tải thông tin bài kiểm tra', '');
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [examId]);

    useEffect(() => {
        if (groupId) {
            const url = `/groups/${groupId}`;
            console.log('[API] GET', url, '- Fetching group detail:', groupId);
            http.get(url)
                .then((res) => {
                    console.log('[API] GET', url, '- Success:', res.data);
                    setGroup(res.data || null);
                })
                .catch((error) => {
                    console.error('[API] GET', url, '- Error:', error);
                });
        }
    }, [groupId]);

    const getActiveTab = () => {
        const path = location.pathname;
        if (path.includes('/students-progress')) return 'students-progress';
        if (path.includes('/submissions')) return 'submissions';
        if (path.includes('/statistics')) return 'statistics';
        return 'overview';
    };

    const activeTab = getActiveTab();
    const statusInfo = exam ? getExamStatus(exam.startTime, exam.endTime) : null;

    const tabItems = [
        {
            key: 'overview',
            label: (
                <NavLink to={`/group/${groupId}/exams/${examId}`} style={{ textDecoration: 'none' }}>
                    Tổng quan
                </NavLink>
            )
        },
        {
            key: 'students-progress',
            label: (
                <NavLink to={`/group/${groupId}/exams/${examId}/students-progress`} style={{ textDecoration: 'none' }}>
                    Tiến độ học sinh
                </NavLink>
            )
        },
        // {
        //     key: 'submissions',
        //     label: (
        //         <NavLink to={`/group/${groupId}/exams/${examId}/submissions`} style={{ textDecoration: 'none' }}>
        //             Bài nộp
        //         </NavLink>
        //     )
        // },
        {
            key: 'statistics',
            label: (
                <NavLink to={`/group/${groupId}/exams/${examId}/statistics`} style={{ textDecoration: 'none' }}>
                    Thống kê
                </NavLink>
            )
        }
    ];

    return (
        <LoadingOverlay loading={loading}>
            <div style={{ padding: '24px' }}>
                {/* Breadcrumb */}
                <Breadcrumb
                    items={[
                        {
                            href: `/${routesConfig.groups}`,
                            title: <><HomeOutlined /> Nhóm</>
                        },
                        {
                            href: `/${routesConfig.groupDetail.replace(':id', groupId || '')}`,
                            title: group?.name || 'Nhóm'
                        },
                        {
                            href: `/${routesConfig.groupExams.replace(':id', groupId || '')}`,
                            title: 'Bài kiểm tra'
                        },
                        {
                            title: exam?.title || 'Bài kiểm tra'
                        }
                    ]}
                    style={{ marginBottom: '24px' }}
                />

                {/* Thông tin chung */}
                {activeTab !== 'statistics' && (
                    <Card 
                        title="THÔNG TIN CHUNG" 
                        style={{ marginBottom: '24px' }}
                        headStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', rowGap: '12px' }}>
                            <div style={{ fontWeight: 'bold' }}>Tiêu đề:</div>
                            <div>{exam?.title || '-'}</div>
                            
                            <div style={{ fontWeight: 'bold' }}>Mô tả:</div>
                            <div>{exam?.description || '-'}</div>
                            
                            <div style={{ fontWeight: 'bold' }}>Thời gian bắt đầu:</div>
                            <div>{exam?.startTime ? dayjs(exam.startTime).format('DD/MM/YYYY HH:mm') : '-'}</div>
                            
                            <div style={{ fontWeight: 'bold' }}>Thời gian kết thúc:</div>
                            <div>{exam?.endTime ? dayjs(exam.endTime).format('DD/MM/YYYY HH:mm') : '-'}</div>
                            
                            <div style={{ fontWeight: 'bold' }}>Trạng thái:</div>
                            <div>
                                {statusInfo && <Tag color={statusInfo.color}>{statusInfo.label}</Tag>}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Tabs */}
                <Tabs
                    activeKey={activeTab}
                    items={tabItems}
                    onChange={(key) => {
                        const basePath = `/group/${groupId}/exams/${examId}`;
                        if (key === 'overview') {
                            navigate(basePath);
                        } else {
                            navigate(`${basePath}/${key}`);
                        }
                    }}
                />
                
                <div style={{ marginTop: '16px' }}>
                    <Outlet />
                </div>
            </div>
        </LoadingOverlay>
    );
});

export default GroupExamDetail;

