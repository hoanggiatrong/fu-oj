import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import globalStore from '../GlobalComponent/globalStore';

interface ScreenLoadingOverlayProps {
    children: React.ReactNode;
}

const ScreenLoadingOverlay = observer(({ children }: ScreenLoadingOverlayProps) => {
    return (
        <div className={classnames('screen-loading-overlay')}>
            {!globalStore.windowLoading && children}
            {globalStore.windowLoading && (
                <div className="loading-container">
                    <div className="loading-logo">
                        <img src="/sources/logo-fullname.png" alt="" />
                        <div className="loading-dot delay-0" />
                        <div className="loading-dot delay-1" />
                        <div className="loading-dot delay-2" />
                    </div>
                </div>
            )}
        </div>
    );
});

export default ScreenLoadingOverlay;
