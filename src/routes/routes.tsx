import ProtectedElementRoute from '../components/ProtectedElementRoute/ProtectedElementRoute';
import Dashboard from '../pages/Dashboard/Dashboard';
import ExamDetail from '../pages/ExamDetail/ExamDetail';
import ExamExercise from '../pages/ExamExercise/ExamExercise';
import ExamResult from '../pages/ExamResult/ExamResult';
import Exams from '../pages/Exams/Exams';
import Exercise from '../pages/Exercise/Exercise';
import ExerciseCompletionList from '../pages/ExerciseCompletionList/ExerciseCompletionList';
import Exercises from '../pages/Exercises/Exercises';
import AIGenerateExercises from '../pages/Exercises/components/AIGenerateExercises';
import GroupDetail from '../pages/GroupDetail/GroupDetail';
import Groups from '../pages/Groups/Groups';
import Home from '../pages/Home/Home';
import Profile from '../pages/Profile/Profile';
import Ranking from '../pages/Ranking/Ranking';
import Topics from '../pages/Topics/Topics';
import routesConfig from './routesConfig';
import Accounts from '../pages/Accounts/Accounts';
import Courses from '../pages/Courses/Courses';
import CourseDetail from '../pages/CourseDetail/CourseDetail';
import Certificates from '../pages/Certificates/Certificates';
import { Route, Navigate } from 'react-router-dom';
import MembersTab from '../pages/GroupDetail/components/MembersTab';
import ExamsTab from '../pages/GroupDetail/components/ExamsTab';
import SubmissionsTab from '../pages/GroupDetail/components/SubmissionsTab';
import ExercisesTab from '../pages/GroupDetail/components/ExercisesTab';
import GroupExamsTab from '../pages/GroupDetail/components/GroupExamsTab';
import GroupExamDetail from '../pages/GroupDetail/components/GroupExamDetail';
import OverviewTab from '../pages/GroupDetail/components/GroupExamDetail/OverviewTab';
import StudentsProgressTab from '../pages/GroupDetail/components/GroupExamDetail/StudentsProgressTab';
import GroupExamSubmissionsTab from '../pages/GroupDetail/components/GroupExamDetail/SubmissionsTab';
import StatisticsTab from '../pages/GroupDetail/components/GroupExamDetail/StatisticsTab';

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
        path: routesConfig.aiExercises,
        element: (
            <ProtectedElementRoute allowedRoles={['INSTRUCTOR']} allowedPermissions={[]}>
                <AIGenerateExercises />
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
            <ProtectedElementRoute allowedRoles={['INSTRUCTOR']} allowedPermissions={[]}>
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
        path: routesConfig.examResult,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT']} allowedPermissions={[]}>
                <ExamResult />
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
    },
    {
        path: routesConfig.courses,
        element: (
            <ProtectedElementRoute allowedRoles={['ADMIN']} allowedPermissions={[]}>
                <Courses />
            </ProtectedElementRoute>
        )
    },
    {
        path: routesConfig.courseDetail,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']} allowedPermissions={[]}>
                <CourseDetail />
            </ProtectedElementRoute>
        )
    },
    {
        path: routesConfig.certificates,
        element: (
            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR', 'ADMIN']} allowedPermissions={[]}>
                <Certificates />
            </ProtectedElementRoute>
        )
    }
];

export const groupRoutes = (
    <Route path="group/:id" element={<GroupDetail />}>
        <Route index element={<Navigate to="members" replace />} />
        <Route
            path="members"
            element={
                <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                    <MembersTab />
                </ProtectedElementRoute>
            }
        />
        <Route
            path="exams/:examId"
            element={
                <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                    <GroupExamDetail />
                </ProtectedElementRoute>
            }
        >
            <Route index element={<OverviewTab />} />
            <Route path="students-progress" element={<StudentsProgressTab />} />
            <Route path="submissions" element={<GroupExamSubmissionsTab />} />
            <Route path="statistics" element={<StatisticsTab />} />
        </Route>
        <Route
            path="exams"
            element={
                <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                    <ExamsTab />
                </ProtectedElementRoute>
            }
        />
        <Route
            path="submissions"
            element={
                <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                    <SubmissionsTab />
                </ProtectedElementRoute>
            }
        />
        <Route
            path="exercises"
            element={
                <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                    <ExercisesTab />
                </ProtectedElementRoute>
            }
        />
        <Route
            path="group-exams"
            element={
                <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                    <GroupExamsTab />
                </ProtectedElementRoute>
            }
        />
    </Route>
);

export default router;
