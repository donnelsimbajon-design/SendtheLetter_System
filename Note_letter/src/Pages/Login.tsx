import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Lock, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';

const Login = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate login
        login({
            id: '1',
            name: 'Demo User',
            email: email,
        });
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 px-4">
            <div className="mb-8 flex flex-col items-center gap-0">
                <img src="/logo.png" alt="SentTheLetter Logo" className="h-24 w-24 object-contain" />
                <h1 className="text-3xl font-serif font-bold text-foreground tracking-wide -mt-2">SentTheLetter</h1>
            </div>
            <Card className="w-full max-w-md p-8 shadow-lg">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary mb-2">Welcome Back</h1>
                    <p className="text-muted-foreground">Sign in to your account to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-muted-foreground" size={20} />
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-muted-foreground" size={20} />
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full py-6 text-lg"
                    >
                        Sign In
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
                </p>
            </Card>
        </div>
    );
};

export default Login;
