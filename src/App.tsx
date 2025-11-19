import { ConfigProvider, theme } from 'antd';
import { useEffect } from 'react';
import 'react-calendar/dist/Calendar.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import GlobalComponent from './components/GlobalComponent/GlobalComponent';
import globalDataStore from './components/GlobalComponent/globalDataStore';
import ProtectedElementRoute from './components/ProtectedElementRoute/ProtectedElementRoute';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import DefaultLayout from './layouts/DefaultLayout/defaultLayout';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import MembersTab from './pages/GroupDetail/components/MembersTab';
import ExamsTab from './pages/GroupDetail/components/ExamsTab';
import SubmissionsTab from './pages/GroupDetail/components/SubmissionsTab';
import ExercisesTab from './pages/GroupDetail/components/ExercisesTab';
import GroupExamsTab from './pages/GroupDetail/components/GroupExamsTab';
import GroupExamDetail from './pages/GroupDetail/components/GroupExamDetail';
import OverviewTab from './pages/GroupDetail/components/GroupExamDetail/OverviewTab';
import StudentsProgressTab from './pages/GroupDetail/components/GroupExamDetail/StudentsProgressTab';
import GroupExamSubmissionsTab from './pages/GroupDetail/components/GroupExamDetail/SubmissionsTab';
import StatisticsTab from './pages/GroupDetail/components/GroupExamDetail/StatisticsTab';
import router from './routes/routes';
import authentication from './shared/auth/authentication';
import ActivateAccount from './pages/Accounts/ActivateAccount';
import './styles/styles.scss';

function App() {
    useEffect(() => {
        authentication.getAccount();
        globalDataStore.init();
    }, []);

    return (
        <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
            <ToastContainer />
            <GlobalComponent />
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <DefaultLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Home />} />
                        {router.map((route) => {
                            // Handle nested routes for GroupDetail
                            if (route.path === 'group/:id') {
                                return (
                                    <Route key={route.path} path={route.path} element={route.element}>
                                        <Route index element={<Navigate to="members" replace />} />
                                        <Route path="members" element={
                                            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                                                <MembersTab />
                                            </ProtectedElementRoute>
                                        } />
                                        <Route path="exams/:examId" element={
                                            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                                                <GroupExamDetail />
                                            </ProtectedElementRoute>
                                        }>
                                            <Route index element={<OverviewTab />} />
                                            <Route path="students-progress" element={<StudentsProgressTab />} />
                                            <Route path="submissions" element={<GroupExamSubmissionsTab />} />
                                            <Route path="statistics" element={<StatisticsTab />} />
                                        </Route>
                                        <Route path="exams" element={
                                            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                                                <ExamsTab />
                                            </ProtectedElementRoute>
                                        } />
                                        <Route path="submissions" element={
                                            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                                                <SubmissionsTab />
                                            </ProtectedElementRoute>
                                        } />
                                        <Route path="exercises" element={
                                            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                                                <ExercisesTab />
                                            </ProtectedElementRoute>
                                        } />
                                        <Route path="group-exams" element={
                                            <ProtectedElementRoute allowedRoles={['STUDENT', 'INSTRUCTOR']} allowedPermissions={[]}>
                                                <GroupExamsTab />
                                            </ProtectedElementRoute>
                                        } />
                                    </Route>
                                );
                            }
                            return <Route key={route.path} path={route.path} element={route.element} />;
                        })}
                        {/* Redirect to home page when route is not found */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Route>

                    {/* --- Route public (không cần login) --- */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/activate-account" element={<ActivateAccount />} />
                    <Route path="/auth/active-account" element={<ActivateAccount />} />
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    );
}

export default App;
