import Exercise from '../pages/Exercise/Exercise';
import ExerciseCompletionList from '../pages/ExerciseCompletionList/ExerciseCompletionList';
import Exercises from '../pages/Exercises/Exercises';
import Home from '../pages/Home/Home';
import routesConfig from './routesConfig';
import Groups from '../pages/Groups/Groups';

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
    }
];

export default router;
