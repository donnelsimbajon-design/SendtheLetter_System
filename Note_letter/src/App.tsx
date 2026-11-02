import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import socketService from './services/socketService';
import { useAuthStore } from './store/authStore';
import DashboardLayout from './components/DashboardLayout';
import UserNotePage from './Pages/user/UserNotePage';
import CommunityPage from './Pages/user/CommunityPage';
import ProfilePage from './Pages/user/ProfilePage';
import UserProfilePage from './Pages/user/UserProfilePage';
import MessagesPage from './Pages/user/MessagesPage';
import DashboardPage from './Pages/user/DashboardPage';
import SettingsPage from './Pages/user/SettingsPage';
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
    const { pathname, search } = useLocation();
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const isVerifying = useAuthStore(state => state.isVerifying);
    if (isVerifying) return <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Checking your writing space…</main>;
    return isAuthenticated ? <>{children}</> : <Navigate to={`/login?returnTo=${encodeURIComponent(pathname + search)}`} replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, user } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return user?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const Landing = () => {
    const { search } = useLocation();
    const params = new URLSearchParams(search);
    const route = params.get('route') || '';
    // Static hosting fallback for direct refreshes of known React routes.
    if (/^\/(?:dashboard(?:\/.*)?|login|signup|about|services|contact|creator|admin)(?:\?.*)?$/.test(route) && !route.startsWith('//')) {
        return <Navigate to={route} replace />;
    }
    return params.has('s') ? <PublicLetterPage /> : <Home />;
};

function App() {
    const { user, isAuthenticated, token, isVerifying, verifySession } = useAuthStore();

    useEffect(() => { void verifySession(); }, [verifySession]);

    useEffect(() => {
        if (!isVerifying && isAuthenticated && user?.id) {
            socketService.connect(user.id, token || '');
        } else {
            socketService.disconnect();
        }
    }, [isAuthenticated, isVerifying, user?.id, token]);

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
                    <Route path="community" element={<CommunityPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="profile/:username" element={<UserProfilePage />} />
                    <Route path="messages" element={<MessagesPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
