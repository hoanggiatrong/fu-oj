import { ConfigProvider, theme } from 'antd';
import { useEffect } from 'react';
import 'react-calendar/dist/Calendar.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import GlobalComponent from './components/GlobalComponent/GlobalComponent';
import globalDataStore from './components/GlobalComponent/globalDataStore';
import globalStore from './components/GlobalComponent/globalStore';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import DefaultLayout from './layouts/DefaultLayout/defaultLayout';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import router from './routes/routes';
import authentication from './shared/auth/authentication';
import ActivateAccount from './pages/Accounts/ActivateAccount';
import './styles/styles.scss';
import { groupRoutes } from './routes/routes';

function App() {
    useEffect(() => {
        authentication.getAccount();
        globalDataStore.init();
    }, []);

    return (
        <ConfigProvider theme={{ algorithm: globalStore.theme == 'theme-light' ? theme.darkAlgorithm : undefined }}>
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
                        {groupRoutes}
                        {router.map((route) => {
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
