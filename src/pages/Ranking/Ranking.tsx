import { TrophyOutlined } from '@ant-design/icons';
import { Avatar, Table, Tag } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import globalStore from '../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import * as http from '../../lib/httpRequest';

interface User {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
    rollNumber: string | null;
}

interface ScoreData {
    id: string;
    user: User;
    totalScore: number;
    solvedEasy: number;
    solvedMedium: number;
    solvedHard: number;
    totalSolved: number;
}

interface ScoresResponse {
    data: ScoreData[];
    metadata: {
        pagination: {
            currentPage: number;
            pageSize: number;
            total: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    };
}

const Ranking = observer(() => {
    const [loading, setLoading] = useState(false);
    const [allDatas, setAllDatas] = useState<ScoreData[]>([]);
    const [topThree, setTopThree] = useState<ScoreData[]>([]);
    const [tableDatas, setTableDatas] = useState<ScoreData[]>([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    const getAllRanking = () => {
        setLoading(true);
        // Lấy tất cả dữ liệu để có top 3 và các người còn lại
        http.get('/scores?page=1&pageSize=100')
            .then((res: ScoresResponse) => {
                const allData = res.data || [];
                setAllDatas(allData);

                // Top 3 cho podium
                const top3 = allData.slice(0, 3);
                setTopThree(top3);

                // Dữ liệu cho bảng (từ người thứ 4 trở đi)
                const tableData = allData.slice(3);
                setTableDatas(tableData);

                setPagination({
                    current: 1,
                    pageSize: 10,
                    total: res.metadata?.pagination?.total || 0
                });
            })
            .catch((error) => {
                console.error('Error fetching scores:', error);
                setAllDatas([]);
                setTopThree([]);
                setTableDatas([]);
                globalStore.triggerNotification(
                    'error',
                    error.response?.data?.message || 'Có lỗi xảy ra khi tải bảng xếp hạng!',
                    ''
                );
            })
            .finally(() => {
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            });
    };

    useEffect(() => {
        getAllRanking();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTableChange = (page: number, pageSize: number) => {
        // Tính toán dữ liệu cho trang hiện tại (bỏ top 3)
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = allDatas.slice(3).slice(startIndex, endIndex);
        setTableDatas(paginatedData);
        setPagination({
            ...pagination,
            current: page,
            pageSize: pageSize
        });
    };

    const getRankIcon = (index: number) => {
        // Rank trong bảng bắt đầu từ 4 (vì top 3 đã ở podium)
        const rank = 4 + (pagination.current - 1) * pagination.pageSize + index;
        if (rank === 1) return '/sources/ranks/rank1.png';
        if (rank === 2) return '/sources/ranks/rank2.png';
        if (rank === 3) return '/sources/ranks/rank3.png';
        return null;
    };

    const getRankColor = (index: number) => {
        // Rank trong bảng bắt đầu từ 4
        const rank = 4 + (pagination.current - 1) * pagination.pageSize + index;
        if (rank === 1) return '#FFD700'; // Gold
        if (rank === 2) return '#C0C0C0'; // Silver
        if (rank === 3) return '#CD7F32'; // Bronze
        return null;
    };

    const columns = [
        {
            title: 'Hạng',
            dataIndex: 'rank',
            key: 'rank',
            width: 100,
            render: (_: unknown, __: unknown, index: number) => {
                // Rank trong bảng bắt đầu từ 4 (vì top 3 đã ở podium)
                const rank = 4 + (pagination.current - 1) * pagination.pageSize + index;
                const rankIcon = getRankIcon(index);
                const rankColor = getRankColor(index);

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {rankIcon ? (
                            <img src={rankIcon} alt={`Rank ${rank}`} style={{ width: 32, height: 32 }} />
                        ) : (
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    backgroundColor: rankColor || '#f0f0f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: rankColor ? '#fff' : '#666',
                                    fontWeight: 'bold',
                                    fontSize: 14
                                }}
                            >
                                {rank}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            title: 'Người dùng',
            dataIndex: 'user',
            key: 'user',
            render: (user: User) => {
                const displayName =
                    user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email?.split('@')[0] || 'Unknown';

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar src={user.avatar} size={40}>
                            {displayName.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                            <div style={{ fontWeight: 500 }}>{displayName}</div>
                            <div style={{ fontSize: 12, color: '#999' }}>{user.email}</div>
                            {user.rollNumber && (
                                <div style={{ fontSize: 12, color: '#999' }}>MSSV: {user.rollNumber}</div>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Tổng điểm',
            dataIndex: 'totalScore',
            key: 'totalScore',
            width: 120,
            sorter: (a: ScoreData, b: ScoreData) => b.totalScore - a.totalScore,
            render: (score: number) => (
                <div style={{ fontWeight: 'bold', fontSize: 16, color: '#1890ff' }}>{score.toFixed(1)}</div>
            )
        },
        {
            title: 'Đã giải',
            dataIndex: 'totalSolved',
            key: 'totalSolved',
            width: 100,
            sorter: (a: ScoreData, b: ScoreData) => b.totalSolved - a.totalSolved,
            render: (total: number) => <Tag color="blue">{total}</Tag>
        },
        {
            title: 'Dễ',
            dataIndex: 'solvedEasy',
            key: 'solvedEasy',
            width: 80,
            sorter: (a: ScoreData, b: ScoreData) => b.solvedEasy - a.solvedEasy,
            render: (count: number) => <Tag color="green">{count}</Tag>
        },
        {
            title: 'Trung bình',
            dataIndex: 'solvedMedium',
            key: 'solvedMedium',
            width: 120,
            sorter: (a: ScoreData, b: ScoreData) => b.solvedMedium - a.solvedMedium,
            render: (count: number) => <Tag color="orange">{count}</Tag>
        },
        {
            title: 'Khó',
            dataIndex: 'solvedHard',
            key: 'solvedHard',
            width: 80,
            sorter: (a: ScoreData, b: ScoreData) => b.solvedHard - a.solvedHard,
            render: (count: number) => <Tag color="red">{count}</Tag>
        }
    ];

    return (
        <div className={classnames('ranking', { 'p-24': globalStore.isBelow1300 })}>
            <div className="header">
                <div className="title">
                    <TrophyOutlined style={{ marginRight: 8, color: '#FFD700' }} />
                    Bảng xếp hạng
                </div>
                <div className="description">
                    Xem thứ hạng của bạn và các thành viên khác dựa trên điểm số và số bài đã giải được.
                </div>
            </div>
            {topThree.length > 0 && (
                <div className="podium-section">
                    <div className="podium-container">
                        {/* Hạng 2 - Bên trái */}
                        {topThree[1] && (
                            <div className="podium-item second-place">
                                <div className="podium-number">2</div>
                                <div className="podium-content">
                                    <Avatar src={topThree[1]?.user?.avatar} size={80} className="podium-avatar">
                                        {topThree[1]?.user?.firstName?.[0] ||
                                            topThree[1]?.user?.email?.[0]?.toUpperCase() ||
                                            '?'}
                                    </Avatar>
                                    <div className="podium-name">
                                        {topThree[1]?.user?.firstName && topThree[1]?.user?.lastName
                                            ? `${topThree[1].user.firstName} ${topThree[1].user.lastName}`
                                            : topThree[1]?.user?.email?.split('@')[0] || 'Unknown'}
                                    </div>
                                    <div className="podium-score">{topThree[1]?.totalScore?.toFixed(1) || '0.0'}</div>
                                    <div className="podium-trophy">
                                        <img src="/sources/ranks/rank2.png" alt="Rank 2" />
                                    </div>
                                </div>
                                <div className="podium-base"></div>
                            </div>
                        )}

                        {/* Hạng 1 - Ở giữa (cao nhất) */}
                        {topThree[0] && (
                            <div className="podium-item first-place">
                                <div className="podium-number">1</div>
                                <div className="podium-content">
                                    <Avatar src={topThree[0]?.user?.avatar} size={100} className="podium-avatar">
                                        {topThree[0]?.user?.firstName?.[0] ||
                                            topThree[0]?.user?.email?.[0]?.toUpperCase() ||
                                            '?'}
                                    </Avatar>
                                    <div className="podium-name">
                                        {topThree[0]?.user?.firstName && topThree[0]?.user?.lastName
                                            ? `${topThree[0].user.firstName} ${topThree[0].user.lastName}`
                                            : topThree[0]?.user?.email?.split('@')[0] || 'Unknown'}
                                    </div>
                                    <div className="podium-score">{topThree[0]?.totalScore?.toFixed(1) || '0.0'}</div>
                                    <div className="podium-trophy">
                                        <img src="/sources/ranks/rank1.png" alt="Rank 1" />
                                    </div>
                                </div>
                                <div className="podium-base"></div>
                            </div>
                        )}

                        {/* Hạng 3 - Bên phải */}
                        {topThree[2] && (
                            <div className="podium-item third-place">
                                <div className="podium-number">3</div>
                                <div className="podium-content">
                                    <Avatar src={topThree[2]?.user?.avatar} size={80} className="podium-avatar">
                                        {topThree[2]?.user?.firstName?.[0] ||
                                            topThree[2]?.user?.email?.[0]?.toUpperCase() ||
                                            '?'}
                                    </Avatar>
                                    <div className="podium-name">
                                        {topThree[2]?.user?.firstName && topThree[2]?.user?.lastName
                                            ? `${topThree[2].user.firstName} ${topThree[2].user.lastName}`
                                            : topThree[2]?.user?.email?.split('@')[0] || 'Unknown'}
                                    </div>
                                    <div className="podium-score">{topThree[2]?.totalScore?.toFixed(1) || '0.0'}</div>
                                    <div className="podium-trophy">
                                        <img src="/sources/ranks/rank3.png" alt="Rank 3" />
                                    </div>
                                </div>
                                <div className="podium-base"></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="body">
                <LoadingOverlay loading={loading}>
                    <Table
                        rowKey="id"
                        scroll={{ x: 1000 }}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: Math.max(0, pagination.total - 3), // Trừ đi top 3
                            showSizeChanger: true,
                            showTotal: () => `Tổng ${pagination.total} người`,
                            onChange: handleTableChange,
                            onShowSizeChange: handleTableChange
                        }}
                        dataSource={tableDatas}
                        columns={columns}
                    />
                </LoadingOverlay>
            </div>
        </div>
    );
});

export default Ranking;
