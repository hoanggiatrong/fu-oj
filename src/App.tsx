import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import GlobalComponent from './components/GlobalComponent/GlobalComponent';
import globalDataStore from './components/GlobalComponent/globalDataStore';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import DefaultLayout from './layouts/DefaultLayout/defaultLayout';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import router from './routes/routes';
import authentication from './shared/auth/authentication';
import './styles/styles.scss';

function App() {
    useEffect(() => {
        authentication.getAccount();
        globalDataStore.init();
    }, []);

    return (
        <>
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
                            return <Route key={route.path} path={route.path} element={route.element} />;
                        })}
                        {/* Redirect to home page when route is not found */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Route>

                    {/* --- Route public (không cần login) --- */}
                    <Route path="/login" element={<Login />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
