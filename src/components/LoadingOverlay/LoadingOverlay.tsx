import { observer } from 'mobx-react-lite';

interface LoadingOverlayProps {
    loading?: boolean;
    children: React.ReactNode;
}

const LoadingOverlay = observer(({ loading = false, children }: LoadingOverlayProps) => {
    return (
        <div className="loading-overlay">
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
