import React from 'react';
import { Navigate } from 'react-router-dom';
import authentication from '../../shared/auth/authentication';
import globalStore from '../GlobalComponent/globalStore';
import { observer } from 'mobx-react-lite';

interface ProtectedElementRouteProps {
    allowedRoles: string[];
    allowedPermissions: string[];
    isAComponent?: boolean;
    children: React.ReactNode;
}

const ProtectedElementRoute: React.FC<ProtectedElementRouteProps> = observer(
    ({ allowedRoles, allowedPermissions, isAComponent, children }) => {
        if (!authentication.account) return <></>;

        const userRoles = authentication.account?.authorities ?? [];

        const userPermissions = authentication.account?.permissions ?? [];

        const hasAccess =
            allowedRoles.some((role) => userRoles.includes(role)) ||
            allowedPermissions.some((permission) => userPermissions.includes(permission));

        if (!hasAccess) {
            if (isAComponent) return <></>;

            globalStore.triggerNotification('warning', 'You do not have permission to access this feature!', '');
            return <Navigate to="/" replace />;
        }

        return <>{children}</>;
    }
);

export default ProtectedElementRoute;
