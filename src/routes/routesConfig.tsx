interface IPageRoutes {
    [key: string]: string;
}

const routesConfig: IPageRoutes = {
    home: 'home',
    exercises: 'exercises',
    exercise: 'exercise/:id?',
    submissionsOfAStudent: 'submissions',
    submissionOfAStudent: 'submission/:submissionId/:exerciseId',
    groups: 'groups',
    groupDetail: 'group/:id?',
    exams: 'exams',
    exam: 'exams/:id',
    examExercise: 'exams/:examId/exercise/:exerciseId',
    topics: 'topics'
};

export default routesConfig;
