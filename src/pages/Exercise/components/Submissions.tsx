import { observer } from 'mobx-react-lite';
import { useState, useEffect } from 'react';
import * as http from '../../../lib/httpRequest';
import './tabset.scss';
import { Input, DatePicker } from 'antd';
import utils from '../../../utils/utils';
import classnames from 'classnames';
import { useNavigate } from 'react-router-dom';
import routesConfig from '../../../routes/routesConfig';

const Submissions = observer(({ id, submissionId }: { id: string | undefined; submissionId: string | undefined }) => {
    const navigate = useNavigate();
    const [datas, setDatas] = useState([]);
    const [displayDatas, setDisplayDatas] = useState([]);

    const getExerciseCompletionListByExerciseId = () => {
        http.get(`/submissions?exercise=${id}&pageSize=99999`).then((res) => {
            setDatas(res.data);
            setDisplayDatas(res.data);
        });
    };

    useEffect(() => {
        getExerciseCompletionListByExerciseId();
    }, []);

    return (
        <div className="submissions">
            <div className="search">
                <Input className="custom" placeholder="Tìm theo ngày" />
                <DatePicker className="custom" placeholder="Từ ngày" />
                <DatePicker className="custom" placeholder="Đến ngày" />
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
                            <div className="submission-info">{utils.formatDate(d.exercise.updatedTimestamp)}</div>
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
    );
});

export default Submissions;
