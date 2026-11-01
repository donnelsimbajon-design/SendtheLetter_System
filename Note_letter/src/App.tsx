import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import socketService from './services/socketService';
import { useAuthStore } from './store/authStore';
import DashboardLayout from './components/DashboardLayout';
import UserNotePage from './Pages/user/UserNotePage';
import ProfilePage from './Pages/user/ProfilePage';
import UserProfilePage from './Pages/user/UserProfilePage';
import MessagesPage from './Pages/user/MessagesPage';
import DashboardPage from './Pages/user/DashboardPage';
import Home from './Pages/Home';
import About from './Pages/About';
import Services from './Pages/Services';
import Contact from './Pages/Contact';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import Creator from './Pages/Creator';
import AdminDashboard from './Pages/AdminDashboard';
import PublicLetterPage from './Pages/user/PublicLetterPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, user } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return user?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const Landing = () => {
    const { search } = useLocation();
    return new URLSearchParams(search).has('s') ? <PublicLetterPage /> : <Home />;
};

function App() {
    const { user, isAuthenticated, token } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && user?.id) {
            socketService.connect(user.id, token || '');
        } else {
            socketService.disconnect();
        }
    }, [isAuthenticated, user?.id, token]);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/creator" element={<Creator />} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/letters/:id" element={<PublicLetterPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
                    <Route index element={<DashboardPage />} />
                    <Route path="notes" element={<UserNotePage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="profile/:username" element={<UserProfilePage />} />
                    <Route path="messages" element={<MessagesPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
