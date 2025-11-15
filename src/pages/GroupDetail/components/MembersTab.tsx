import { Input } from 'antd';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as http from '../../../lib/httpRequest';
import MembersTable from './MembersTable';

const MembersTab = observer(() => {
    const { id } = useParams();
    const [displayDatas, setDisplayDatas] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (id) {
            const url = `/groups/${id}/students`;
            console.log('[API] GET', url, '- Fetching students for group:', id);
            http.get(url)
                .then((res) => {
                    console.log('[API] GET', url, '- Success:', res.data);
                    setDisplayDatas(res.data);
                })
                .catch((error) => {
                    console.error('[API] GET', url, '- Error:', error);
                });
        }
    }, [id]);

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Input
                    placeholder="Tìm thành viên"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '400px' }}
                />
            </div>
            <MembersTable
                dataSource={displayDatas}
                search={search}
                onRowClick={(record) => {
                    console.log('Row clicked:', record);
                }}
            />
        </div>
    );
});

export default MembersTab;

