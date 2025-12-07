import { observer } from 'mobx-react-lite';
import classnames from 'classnames';

interface LoadingOverlayProps {
    classNames?: string;
    loading?: boolean;
    children: React.ReactNode;
}

const LoadingOverlay = observer(({ classNames, loading = false, children }: LoadingOverlayProps) => {
    return (
        <div className={classnames('loading-overlay', classNames)}>
            {children}
            {loading && (
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

export default LoadingOverlay;
