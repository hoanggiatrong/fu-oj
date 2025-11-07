import { SearchOutlined } from '@ant-design/icons';
import { Button, Input, Select, Table, Tag } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import Highlighter from 'react-highlight-words';
import { useNavigate } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import Line from '../../components/Line/Line';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import * as http from '../../lib/httpRequest';
import routesConfig from '../../routes/routesConfig';
import authentication from '../../shared/auth/authentication';

const ExerciseCompletionList = observer(() => {
    const navigate = useNavigate();
    const [datas, setDatas] = useState([]);
    datas;
    const [topics, setTopics] = useState([]);
    const [displayDatas, setDisplayDatas] = useState([]);
    const [search, setSearch] = useState('');

    const columns = [
        {
            title: 'Mã bài tập',
            dataIndex: 'exercise',
            key: 'code',
            sorter: (a: any, b: any) => (a.exercise.code || '').localeCompare(b.exercise.code || ''),
            render: (exercise: any) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={exercise?.code}
                    />
                );
            }
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'exercise',
            key: 'title',
            sorter: (a: any, b: any) => (a.exercise.title || '').localeCompare(b.exercise.title || ''),
            render: (exercise: any) => {
                return (
                    <Highlighter
                        highlightClassName="highlight"
                        searchWords={[search]}
                        autoEscape={true}
                        textToHighlight={exercise?.title}
                    />
                );
            }
        },
        {
            title: 'Mô tả',
            dataIndex: 'exercise',
            key: 'description',
            render: (exercise: any) => {
                return exercise?.description;
            }
        },
        {
            title: 'Chủ đề',
            dataIndex: 'exercise',
            key: 'topics',
            render: (exercise: any) => {
                if (!exercise.topics) return null;

                const topics = exercise.topics;

                return topics.map((topic: any, index: any) => {
                    const text = topic.name.trim().toUpperCase();
                    const colors = [
                        'magenta',
                        'red',
                        'volcano',
                        'orange',
                        'gold',
                        'lime',
                        'green',
                        'cyan',
                        'blue',
                        'geekblue',
                        'purple'
                    ];
                    const color = colors[index];

                    return (
                        <Tag color={color} key={text} style={{ marginBottom: 8 }}>
                            {text}
                        </Tag>
                    );
                });
            }
        }
    ];

    const handleChange = (value: string[]) => {
        console.log(`selected ${value}`);
    };

    const getExerciseCompletionList = () => {
        http.get(`/submissions?student=${authentication.account?.data.id}`).then((res) => {
            console.log('res.data:', res.data);
            setDatas(res.data);
            setDisplayDatas(res.data);
        });
    };

    useEffect(() => {
        if (authentication.account?.data.id) {
            getExerciseCompletionList();

            http.get('/topics').then((res) => {
                setTopics(res.data.map((topic: any) => ({ ...topic, value: topic.id, label: topic.name })));
            });
        }
    }, [authentication.account?.data.id]);

    return (
        <div className="exercises">
            <div className="header">
                <div className="title">Danh sách các bài đã nộp</div>
                <div className="description">
                    Để bắt đầu một cách thuận lợi, bạn nên tập trung vào một lộ trình học. Ví dụ: Để đi làm với vị trí
                    "Lập trình viên Front-end" bạn nên tập trung vào lộ trình "Front-end".
                </div>
            </div>
            <div
                className={classnames('wrapper flex', {
                    'flex-col wrapper-responsive': globalStore.windowSize.width < 1300
                })}
            >
                <div className="search">
                    <div className="title">
                        <SearchOutlined />
                        Bộ lọc
                    </div>
                    <Input
                        value={search}
                        placeholder="Tìm kiếm theo Mã, Tên, Mô tả, Chủ đề"
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Line width={0} height={0} text="Chủ đề" center />
                    <Select
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder="Select topics"
                        defaultValue={[]}
                        onChange={handleChange}
                        options={topics}
                    />
                    <ProtectedElement acceptRoles={['INSTRUCTOR']}>
                        <Line width={0} height={0} text="Quản lý" center />
                        <Button onClick={() => globalStore.setOpenDetailPopup(true)}>Tạo mới</Button>
                    </ProtectedElement>
                </div>
                <div className="body">
                    <Table
                        rowKey="id"
                        scroll={{ x: 800 }}
                        pagination={{ pageSize: 10, showSizeChanger: false }}
                        dataSource={displayDatas}
                        columns={columns}
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    navigate(
                                        `/${routesConfig.submissionOfAStudent}`
                                            .replace(':exerciseId', record.exercise.id)
                                            .replace(':submissionId', record.id)
                                    );
                                }
                            };
                        }}
                    />
                </div>
            </div>
        </div>
    );
});

export default ExerciseCompletionList;
