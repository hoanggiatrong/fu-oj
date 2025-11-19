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
    groupDetail: 'group/:id',
    groupMembers: 'group/:id/members',
    groupExams: 'group/:id/exams',
    groupExamDetail: 'group/:groupId/exams/:examId',
    groupSubmissions: 'group/:id/submissions',
    groupExercises: 'group/:id/exercises',
    groupGroupExams: 'group/:id/group-exams',
    exams: 'exams',
    exam: 'exams/:id',
    examResult: 'exams/:examId/result',
    examExercise: 'exams/:examId/exercise/:exerciseId',
    topics: 'topics',
    ranking: 'ranking',
    dashboard: 'dashboard',
    profile: 'profile',
    accounts: 'accounts',
    courses: 'courses',
    courseDetail: 'courses/:courseId',
    aiExercises: 'ai-exercises',
    certificates: 'certificates'
    activateAccount: 'activate-account'
};

export default routesConfig;
