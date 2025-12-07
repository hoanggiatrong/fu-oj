import { DatePicker, Select } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as http from '../../../lib/httpRequest';
import routesConfig from '../../../routes/routesConfig';
import utils from '../../../utils/utils';
import './tabset.scss';
import authentication from '../../../shared/auth/authentication';
import LoadingOverlay from '../../../components/LoadingOverlay/LoadingOverlay';

const Submissions = observer(({ id, submissionId }: { id: string | undefined; submissionId: string | undefined }) => {
    const navigate = useNavigate();
    const [datas, setDatas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [displayDatas, setDisplayDatas] = useState([]);
    const [filters, setFilters] = useState<any>({
        from: null,
        to: null,
        result: null
    });

    const handleFilterChange = (key: string, value: any) => {
        setFilters((prev: any) => ({
            ...prev,
            [key]: value
        }));
    };

    const getExerciseCompletionListByExerciseId = () => {
        setLoading(true);

        http.get(`/submissions?exercise=${id}&student=${authentication?.account?.data?.id}&pageSize=99999`)
            .then((res) => {
                setDatas(res.data);
                setDisplayDatas(res.data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        getExerciseCompletionListByExerciseId();
    }, []);

    const applyFilter = () => {
        let filtered = [...datas];

        if (filters.from) {
            const fromDate = filters.from.startOf('day').toDate(); // nếu filters.from là moment
            filtered = filtered.filter((d: any) => new Date(d.updatedTimestamp) >= fromDate);
        }

        if (filters.to) {
            const toDate = filters.to.endOf('day').toDate(); // đảm bảo bao gồm cả ngày cuối
            filtered = filtered.filter((d: any) => new Date(d.updatedTimestamp) <= toDate);
        }

        if (filters.result !== null && filters.result !== undefined) {
            filtered = filtered.filter((d: any) => d.isAccepted === filters.result);
        }

        setDisplayDatas(filtered);
    };

    useEffect(() => {
        applyFilter();
    }, [filters]);

    return (
        <LoadingOverlay classNames="max-height" loading={loading}>
            <div className="submissions">
                <div className="search">
                    <DatePicker
                        className="custom"
                        placeholder="Từ ngày"
                        onChange={(date) => handleFilterChange('from', date)}
                    />
                    <DatePicker
                        className="custom"
                        placeholder="Đến ngày"
                        onChange={(date) => handleFilterChange('to', date)}
                    />
                    <Select
                        className="custom"
                        allowClear
                        placeholder="Chọn kết quả"
                        onChange={(value) => handleFilterChange('result', value)}
                        options={[
                            { value: true, label: 'Đã thông qua' },
                            { value: false, label: 'Chưa thông qua' }
                        ]}
                    />
                </div>
                <div className="container">
                    {displayDatas.map((d: any, index: number) => {
                        return (
                            <div
                                className={classnames('submission', {
                                    odd: index % 2 === 0,
                                    selected: submissionId == d.id
                                })}
                                onClick={() => {
                                    if (id) {
                                        navigate(
                                            `/${routesConfig.submissionOfAStudent}`
                                                .replace(':exerciseId', id)
                                                .replace(':submissionId', d.id)
                                        );
                                    }
                                }}
                            >
                                <div className="submission-info">{utils.formatDateVN(d.updatedTimestamp)}</div>
                                <div className="submission-info">
                                    {d.isAccepted ? (
                                        <div className="color-cyan">Đã thông qua</div>
                                    ) : (
                                        <div className="color-red">Chưa thông qua</div>
                                    )}
                                </div>
                                <div className="submission-info">{utils.getColor(d.verdict)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </LoadingOverlay>
    );
});

export default Submissions;
