import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import globalStore from '../../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../../components/LoadingOverlay/LoadingOverlay';
import * as http from '../../../lib/httpRequest';
import MembersTable from './MembersTable';

const MembersTab = observer(() => {
    const { id } = useParams();
    const [displayDatas, setDisplayDatas] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = () => {
        if (id) {
            setLoading(true);

            const url = `/groups/${id}/students`;
            console.log('[API] GET', url, '- Fetching students for group:', id);
            http.get(url)
                .then((res) => {
                    console.log('[API] GET', url, '- Success:', res.data);
                    setDisplayDatas(res.data);
                })
                .catch((error) => {
                    console.error('[API] GET', url, '- Error:', error);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    };

    return (
        <div className="leetcode">
            <div
                className={classnames('wrapper max-width flex flex-1', {
                    'flex-col wrapper-responsive': globalStore.windowSize.width < 1300,
                    'pr-16': globalStore.windowSize.width > 1300
                })}
            >
                <div className="filters">
                    <Input
                        placeholder="Tìm thành viên"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        prefix={<SearchOutlined />}
                    />
                </div>
                <div className="body">
                    <LoadingOverlay loading={loading}>
                        <MembersTable
                            groupId={id}
                            loadData={loadData}
                            dataSource={displayDatas}
                            search={search}
                            onRowClick={(record) => {
                                console.log('Row clicked:', record);
                            }}
                        />
                    </LoadingOverlay>
                </div>
            </div>
        </div>
    );
});

export default MembersTab;
