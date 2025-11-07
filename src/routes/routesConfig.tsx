interface IPageRoutes {
    [key: string]: string;
}

const routesConfig: IPageRoutes = {
    home: 'home',
    exercises: 'exercises',
    exercise: 'exercise/:id?',
    submissionsOfAStudent: 'submissions',
    submissionOfAStudent: 'submission/:submissionId/:exerciseId',
    groups: 'groups'
};

export default routesConfig;
