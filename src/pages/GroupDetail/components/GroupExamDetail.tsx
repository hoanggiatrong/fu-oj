import { Card, Col, Row, Tabs, Tag } from 'antd';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import globalStore from '../../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../../components/LoadingOverlay/LoadingOverlay';
import * as http from '../../../lib/httpRequest';

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
            return { status: 'completed', label: 'Đã kết thúc', color: 'red' };
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
    group;
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
            <div>
                {activeTab !== 'statistics' && (
                    <Card className="event-none mb-16" title="THÔNG TIN CHUNG">
                        <Row gutter={24}>
                            <Col span={24} className="mt-8">
                                <Row gutter={24}>
                                    <Col span={globalStore.isBelow1000 ? 12 : 4} className="bold color-text-secondary">
                                        Tiêu đề
                                    </Col>
                                    <Col span={globalStore.isBelow1000 ? 12 : 20} className="color-text-secondary">
                                        {exam?.title || '-'}
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24} className="mt-8">
                                <Row gutter={24}>
                                    <Col span={globalStore.isBelow1000 ? 12 : 4} className="bold color-text-secondary">
                                        Mô tả
                                    </Col>
                                    <Col span={globalStore.isBelow1000 ? 12 : 20} className="color-text-secondary">
                                        {exam?.description || '-'}
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24} className="mt-8">
                                <Row gutter={24}>
                                    <Col span={globalStore.isBelow1000 ? 12 : 4} className="bold color-text-secondary">
                                        Thời gian bắt đầu
                                    </Col>
                                    <Col span={globalStore.isBelow1000 ? 12 : 20} className="color-text-secondary">
                                        {exam?.startTime ? dayjs(exam.startTime).format('DD/MM/YYYY HH:mm') : '-'}
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24} className="mt-8">
                                <Row gutter={24}>
                                    <Col span={globalStore.isBelow1000 ? 12 : 4} className="bold color-text-secondary">
                                        Thời gian kết thúc
                                    </Col>
                                    <Col span={globalStore.isBelow1000 ? 12 : 20} className="color-text-secondary">
                                        {exam?.endTime ? dayjs(exam.endTime).format('DD/MM/YYYY HH:mm') : '-'}
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24} className="mt-8">
                                <Row gutter={24}>
                                    <Col span={globalStore.isBelow1000 ? 12 : 4} className="bold color-text-secondary">
                                        Trạng thái
                                    </Col>
                                    <Col span={globalStore.isBelow1000 ? 12 : 20}>
                                        {statusInfo && <Tag color={statusInfo.color}>{statusInfo.label}</Tag>}
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Card>
                )}

                {/* Tabs */}
                <Tabs
                    className="p-8"
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

                <div className={classnames({ 'p-8': !globalStore.isBelow1300 })}>
                    <Outlet />
                </div>
            </div>
        </LoadingOverlay>
    );
});

export default GroupExamDetail;
