import { LogoutOutlined, RocketOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import globalStore from '../../../components/GlobalComponent/globalStore';
import ProtectedElement from '../../../components/ProtectedElement/ProtectedElement';
import * as http from '../../../lib/httpRequest';
import routesConfig from '../../../routes/routesConfig';
import authentication from '../../../shared/auth/authentication';
import utils from '../../../utils/utils';

const QuickAction = observer(() => {
    const navigate = useNavigate();
    // const [selected, select] = useState(0);
    const [datas, setDatas] = useState([]);

    const selectRandom = () => {
        // Đoạn này lấy từ kết quả lọc ra
        if (datas.length == 0) {
            globalStore.triggerNotification('error', 'Không tìm thấy bài tập', '');
        } else {
            const includeTestCaseDatas = datas.filter((d: any) => d.testCases.length > 0);
            const randomInt = utils.getRandomInt(includeTestCaseDatas.length);
            const randomSelect: any = includeTestCaseDatas[randomInt];
            navigate(`/${routesConfig.exercise}`.replace(':id?', randomSelect?.id));
        }
    };

    const getExercises = () => {
        http.get('/exercises?pageSize=9999999').then((res) => {
            const userId = authentication?.account?.data?.id;
            const filteredData = res.data.filter((d: any) =>
                authentication.isInstructor ? d.createdBy == userId : true
            );

            setDatas(filteredData);
        });
    };

    useEffect(() => {
        getExercises();
    }, []);

    return (
        <div className="quick-action">
            <ul>
                {/* <li
                    onClick={() => {
                        globalStore.triggerNotification(
                            'error',
                            'Tính năng đang được phát triển',
                            'Dùng cái khác đê!!!'
                        );
                    }}
                >
                    <div className="action-item">
                        <SketchOutlined className="ico" />
                        Top rank
                    </div>
                </li> */}
                <ProtectedElement acceptRoles={['STUDENT']}>
                    <li className="selected" onClick={selectRandom}>
                        <div className="action-item">
                            <RocketOutlined className="ico" />
                            Thử thách
                        </div>
                    </li>
                </ProtectedElement>
                {/* <li
                    onClick={() => {
                        globalStore.setWindowLoading(true);
                        authentication.logout();
                        setTimeout(() => {
                            authentication.login('instructor@fpt.edu.vn', '123456', true);
                            globalStore.setWindowLoading(false);
                        }, 1000);
                    }}
                >
                    <div className="action-item">
                        <LogoutOutlined className="ico" />
                        {'->'} Instructor
                    </div>
                </li>
                <li
                    onClick={() => {
                        authentication.logout();
                        globalStore.setWindowLoading(true);
                        setTimeout(() => {
                            authentication.login('admin@fpt.edu.vn', '123456', true);
                            globalStore.setWindowLoading(false);
                        }, 1000);
                    }}
                >
                    <div className="action-item">
                        <LogoutOutlined className="ico" />
                        {'->'} Admin
                    </div>
                </li>
                <li
                    onClick={() => {
                        authentication.logout();
                        globalStore.setWindowLoading(true);
                        setTimeout(() => {
                            authentication.login('student@fpt.edu.vn', '123456', true);
                            globalStore.setWindowLoading(false);
                        }, 1000);
                    }}
                >
                    <div className="action-item">
                        <LogoutOutlined className="ico" />
                        {'->'} Student
                    </div>
                </li> */}
            </ul>
        </div>
    );
});

export default QuickAction;
