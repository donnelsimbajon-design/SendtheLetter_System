import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import DashboardLayout from './components/DashboardLayout';
import UserNotePage from './Pages/user/UserNotePage';
import ProfilePage from './Pages/user/ProfilePage';
import MessagesPage from './Pages/user/MessagesPage';
import DashboardPage from './Pages/user/DashboardPage';
import Home from './Pages/Home';
import About from './Pages/About';
import Services from './Pages/Services';
import Contact from './Pages/Contact';
import Login from './Pages/Login';
import Signup from './Pages/Signup';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Private Routes */}
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <DashboardLayout />
                        </PrivateRoute>
                    }
                >
                    <Route index element={<DashboardPage />} />
                    <Route path="notes" element={<UserNotePage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="messages" element={<MessagesPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
