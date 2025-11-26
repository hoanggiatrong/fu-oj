import { FilterOutlined } from '@ant-design/icons';
import { Button, Input, Popover, Select, Table, Tag, Tooltip } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import Highlighter from 'react-highlight-words';
import { useNavigate } from 'react-router-dom';
import CustomCalendar from '../../components/CustomCalendar/CustomCalendar';
import globalStore from '../../components/GlobalComponent/globalStore';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import * as http from '../../lib/httpRequest';
import routesConfig from '../../routes/routesConfig';
import authentication from '../../shared/auth/authentication';
import utils from '../../utils/utils';

const ExerciseCompletionList = observer(() => {
    const navigate = useNavigate();
    const [datas, setDatas] = useState([]);
    datas;
    const [topics, setTopics] = useState([]);
    const [displayDatas, setDisplayDatas] = useState([]);
    const [search, setSearch] = useState('');
    const [isFilterOpen, setFilterOpen]: any = useState(false);
    const [filters, setFilters] = useState({
        topicIds: []
    });

    const columns = [
        {
            title: 'Mã bài tập',
            dataIndex: 'exercise',
            key: 'code',
            sorter: (a: any, b: any) => (a.exercise.code || '').localeCompare(b.exercise.code || ''),
            render: (exercise: any) => {
                return (
                    <div className="cell">
                        <Highlighter
                            highlightClassName="highlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={exercise?.code}
                        />
                    </div>
                );
            }
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'exercise',
            key: 'title',
            sorter: (a: any, b: any) => (a.exercise.title || '').localeCompare(b.exercise.title || ''),
            render: (exercise: any, record: any) => {
                console.log('log:', record);
                return (
                    <div className="cell">
                        <Tooltip
                            placement="right"
                            className="custom-tooltip"
                            title={
                                <>
                                    <div className="custom-tooltip-child">
                                        <div className="custom-select-exercises">
                                            <div className="name">
                                                {record?.exercise?.title}
                                                <span
                                                    className={classnames('difficulty', record?.exercise?.difficulty)}
                                                >
                                                    {record?.exercise?.difficulty}
                                                </span>
                                            </div>
                                            <div className="description">
                                                <b>Mô tả: </b>
                                                {record?.exercise?.description}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            }
                        >
                            <Highlighter
                                highlightClassName="highlight"
                                searchWords={[search]}
                                autoEscape={true}
                                textToHighlight={exercise?.title}
                            />
                        </Tooltip>
                    </div>
                );
            }
        },
        // {
        //     title: 'Mô tả',
        //     dataIndex: 'exercise',
        //     key: 'description',
        //     render: (exercise: any) => {
        //         return (
        //             <div className="cell">
        //                 <div className="max-1-line">{exercise?.description}</div>
        //             </div>
        //         );
        //     }
        // },
        {
            title: 'Chủ đề',
            dataIndex: 'exercise',
            key: 'topics',
            render: (exercise: any) => {
                if (!exercise.topics) return null;

                const topics = exercise.topics;

                return (
                    <div className="cell gap">
                        {topics.map((topic: any, index: any) => {
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
                        })}
                    </div>
                );
            }
        }
    ];

    const handleChange = (value: string[]) => {
        console.log(`selected ${value}`);
    };

    const getExerciseCompletionList = () => {
        http.get(`/submissions?student=${authentication.account?.data.id}&pageSize=99999`).then((res) => {
            setDatas(res.data);
            setDisplayDatas(res.data);
        });
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    const applyFilter = () => {
        const filtered = datas.filter((item: any) => {
            if (filters.topicIds.length > 0) {
                const itemTopicIds = item.exercise.topics?.map((t: any) => t.id) || [];
                const hasMatch = filters.topicIds.some((id: any) => itemTopicIds.includes(id));
                if (!hasMatch) return false;
            }

            return true;
        });

        setDisplayDatas(filtered);
        setFilterOpen(false);
    };

    useEffect(() => {
        if (authentication.account?.data.id) {
            getExerciseCompletionList();

            http.get('/topics').then((res) => {
                setTopics(res.data.map((topic: any) => ({ ...topic, value: topic.id, label: topic.name })));
            });
        }
    }, [authentication.account?.data.id]);

    useEffect(() => {
        const searchLowerCase = search.toLowerCase();

        const filtered = datas.filter(
            (d: any) =>
                d.exercise.code.toLowerCase().includes(searchLowerCase) ||
                d.exercise.title.toLowerCase().includes(searchLowerCase)
        );
        setDisplayDatas(filtered);
    }, [search, datas]);

    return (
        <div className="leetcode">
            <div className={classnames('exercises left', { 'p-24': globalStore.isBelow1300 })}>
                <div className="header">
                    <div className="title">Danh sách các bài đã nộp</div>
                    <div className="description">
                        Để bắt đầu một cách thuận lợi, bạn nên tập trung vào một lộ trình học. Ví dụ: Để đi làm với vị
                        trí "Lập trình viên Front-end" bạn nên tập trung vào lộ trình "Front-end".
                    </div>
                </div>
                <div
                    className={classnames('wrapper flex', {
                        'flex-col wrapper-responsive': globalStore.windowSize.width < 1300
                    })}
                >
                    <div className="filters">
                        <Input
                            placeholder="Tìm kiếm bài tập"
                            onChange={(e) => setSearch(e.target.value)}
                            data-tourid="search-input"
                        />

                        {/* <TooltipWrapper tooltipText="Sắp xếp" position="top">
                            <Popover
                                content={<div className="custom-pop-content">ab</div>}
                                title="Sắp xếp"
                                trigger="click"
                                open={isSortOpen}
                                onOpenChange={(open) => setSortOpen(open)}
                                placement="bottom"
                            >
                                <div className="custom-circle-ico">
                                    <img className="" src="/sources/icons/sort-ico.svg" />
                                </div>
                            </Popover>
                        </TooltipWrapper> */}

                        <TooltipWrapper tooltipText="Bộ lọc" position="top">
                            <Popover
                                content={
                                    <div className="custom-pop-content">
                                        {/* <div className="filter-container">
                                            <div className="filter-name">Độ khó</div>
                                            <Select
                                                allowClear
                                                style={{ width: '100%' }}
                                                placeholder="Chọn độ khó"
                                                onChange={(value) => handleFilterChange('difficulty', value)}
                                                options={[
                                                    { value: 'EASY', label: 'EASY' },
                                                    { value: 'MEDIUM', label: 'MEDIUM' },
                                                    { value: 'HARD', label: 'HARD' }
                                                ]}
                                            />
                                        </div> */}
                                        <div className="filter-container">
                                            <div className="filter-name">Chủ đề</div>
                                            <Select
                                                allowClear
                                                mode="multiple"
                                                style={{ width: '100%' }}
                                                placeholder="Chọn chủ đề"
                                                defaultValue={[]}
                                                onChange={(value) => handleFilterChange('topicIds', value)}
                                                options={topics}
                                            />
                                        </div>
                                        {/* <div className="filter-container">
                                            <div className="filter-name">Khả năng hiển thị</div>
                                            <Select
                                                allowClear
                                                style={{ width: '100%' }}
                                                placeholder="Chọn khả năng hiển thị"
                                                onChange={(value) => handleFilterChange('visibility', value)}
                                                options={[
                                                    { value: 'DRAFT', label: 'DRAFT' },
                                                    { value: 'PUBLIC', label: 'PUBLIC' },
                                                    { value: 'PRIVATE', label: 'PRIVATE' }
                                                ]}
                                            />
                                        </div> */}
                                        <Button type="primary" className="apply-filter" onClick={applyFilter}>
                                            Áp dụng
                                        </Button>
                                    </div>
                                }
                                title="Bộ lọc"
                                trigger="click"
                                open={isFilterOpen}
                                onOpenChange={(open) => setFilterOpen(open)}
                                placement="bottom"
                            >
                                <div className="custom-circle-ico" data-tourid="filter-btn">
                                    <FilterOutlined className="custom-ant-ico" />
                                </div>
                            </Popover>
                        </TooltipWrapper>
                    </div>
                    <div className="body">
                        <Table
                            rowKey="id"
                            scroll={{ x: 800 }}
                            pagination={{ pageSize: 20, showSizeChanger: false }}
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
                            rowClassName={(_record, index) =>
                                index % 2 === 0 ? 'custom-row row-even' : 'custom-row row-odd'
                            }
                        />
                    </div>
                </div>
            </div>
            <div className="right">
                <CustomCalendar dateArr={utils.getDates()} />
            </div>
        </div>
    );
});

export default ExerciseCompletionList;
