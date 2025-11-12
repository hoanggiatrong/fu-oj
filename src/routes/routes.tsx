
import ExamDetail from '../pages/ExamDetail/ExamDetail';
import ExamExercise from '../pages/ExamExercise/ExamExercise';
import Exams from '../pages/Exams/Exams';
import Exercise from '../pages/Exercise/Exercise';
import ExerciseCompletionList from '../pages/ExerciseCompletionList/ExerciseCompletionList';
import Exercises from '../pages/Exercises/Exercises';
import GroupDetail from '../pages/GroupDetail/GroupDetail';
import Groups from '../pages/Groups/Groups';
import Home from '../pages/Home/Home';
import Ranking from '../pages/Ranking/Ranking';
import Topics from '../pages/Topics/Topics';
import routesConfig from './routesConfig';
import Accounts from '../pages/Accounts/Accounts';

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
        path: routesConfig.exam,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                <ExamDetail />
            </ProtectedElementRoute>
        )
    },
    {
        path: routesConfig.examExercise,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                <ExamExercise />
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
    },
    {
        path: routesConfig.ranking,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                <Ranking />
            </ProtectedElementRoute>
        )
    },
    {
        path: routesConfig.dashboard,
        element: (
            <ProtectedElementRoute allowedRoles={['INSTRUCTOR']} allowedPermissions={[]}>
                <Dashboard />
            </ProtectedElementRoute>
        )
    },
    {
        path: routesConfig.profile,
        element: <Profile />
    },

    {
        path: routesConfig.accounts,
        element: (
            <ProtectedElementRoute allowedRoles={['ADMIN']} allowedPermissions={[]}>
                <Accounts />
            </ProtectedElementRoute>
        )
    }
];

export default router;
