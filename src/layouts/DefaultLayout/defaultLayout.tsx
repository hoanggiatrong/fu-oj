import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import LayoutFooter from './components/LayoutFooter';
import LayoutHeader from './components/LayoutHeader';
import LayoutMenu from './components/LayoutMenu';
import classnames from 'classnames';
import globalStore from '../../components/GlobalComponent/globalStore';
import { useLocation } from 'react-router-dom';

const DefaultLayout = observer(() => {
    const location = useLocation();
    const isOnExercisePage = location.pathname.includes('/exercise/') || location.pathname.includes('/submission/');

    useEffect(() => {}, []);

    return (
        <div className="default-layout">
            {!isOnExercisePage && <LayoutHeader />}

            <div
                className={classnames('layout-content flex', {
                    'flex-col': globalStore.windowSize.width < 1300
                })}
            >
                {!isOnExercisePage && <LayoutMenu />}
                <div
                    className={classnames('outlet', {
                        'outlet-responsive': globalStore.windowSize.width < 1300,
                        'outlet-min': globalStore.windowSize.width < 675,
                        'outlet-exercise': isOnExercisePage
                    })}
                >
                    <Outlet />
                </div>
            </div>
            {!isOnExercisePage && <LayoutFooter />}
        </div>
    );
});

export default DefaultLayout;
