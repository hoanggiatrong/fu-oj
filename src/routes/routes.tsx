import Exercise from '../pages/Exercise/Exercise';
import ExerciseCompletionList from '../pages/ExerciseCompletionList/ExerciseCompletionList';
import Exercises from '../pages/Exercises/Exercises';
import Home from '../pages/Home/Home';
import routesConfig from './routesConfig';
import Groups from '../pages/Groups/Groups';
import GroupDetail from '../pages/GroupDetail/GroupDetail';
import Exams from '../pages/Exams/Exams';

const router: {
    path: string;
    element: React.ReactNode;
}[] = [
    {
        path: routesConfig.home,
        element: <Home />
    },
    {
        path: routesConfig.exercises,
        element: <Exercises />
    },
    {
        path: routesConfig.exercise,
        element: <Exercise />
    },
    {
        path: routesConfig.submissionsOfAStudent,
        element: <ExerciseCompletionList />
    },
    {
        path: routesConfig.submissionOfAStudent,
        element: <Exercise />
    },
    {
        path: routesConfig.groups,
        element: <Groups />
    },
    {
        path: routesConfig.groupDetail,
        element: <GroupDetail />
    },
    {
        path: routesConfig.exams,
        element: <Exams />
    }
];

export default router;
