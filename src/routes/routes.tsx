import Exercise from '../pages/Exercise/Exercise';
import ExerciseCompletionList from '../pages/ExerciseCompletionList/ExerciseCompletionList';
import Exercises from '../pages/Exercises/Exercises';
import Home from '../pages/Home/Home';
import routesConfig from './routesConfig';
import Groups from '../pages/Groups/Groups';
import GroupDetail from '../pages/GroupDetail/GroupDetail';
import Exams from '../pages/Exams/Exams';
import Topics from '../pages/Topics/Topics';
import ProtectedElementRoute from '../components/ProtectedElementRoute/ProtectedElementRoute';

const router: {
    path: string;
    element: React.ReactNode;
}[] = [
    {
        path: routesConfig.home,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']} allowedPermissions={[]}>
                <Home />
            </ProtectedElementRoute>
        )
    },
    {
        path: routesConfig.exercises,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                <Exercises />
            </ProtectedElementRoute>
        )
    },
    {
        path: routesConfig.exercise,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                <Exercise />
            </ProtectedElementRoute>
        )
    },
    {
        path: routesConfig.submissionsOfAStudent,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                <ExerciseCompletionList />
            </ProtectedElementRoute>
        )
    },
    {
        path: routesConfig.submissionOfAStudent,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                <Exercise />
            </ProtectedElementRoute>
        )
    },
    {
        path: routesConfig.groups,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                <Groups />
            </ProtectedElementRoute>
        )
    },
    {
        path: routesConfig.groupDetail,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                <GroupDetail />
            </ProtectedElementRoute>
        )
    },
    {
        path: routesConfig.exams,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                <Exams />
            </ProtectedElementRoute>
        )
    },
    {
        path: routesConfig.topics,
        element: (
            <ProtectedElementRoute allowedRoles={['ADMIN']} allowedPermissions={[]}>
                <Topics />
            </ProtectedElementRoute>
        )
    }
];

export default router;
