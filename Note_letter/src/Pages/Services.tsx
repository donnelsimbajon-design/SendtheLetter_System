import { Link } from 'react-router-dom';
import { PenTool, Music, Share2, Lock, Zap, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';

const Services = () => {
    const features = [
        {
            icon: PenTool,
            title: 'Digital Letters',
            desc: 'Compose with our distraction-free editor.',
            position: 'top-left'
        },
        {
            icon: Music,
            title: 'Music Integration',
            desc: 'Attach a soundtrack to your emotions.',
            position: 'bottom-left'
        },
        {
            icon: Share2,
            title: 'Instant Delivery',
            desc: 'Send now or schedule for the future.',
            position: 'top-right'
        },
        {
            icon: Lock,
            title: 'End-to-End Encrypted',
            desc: 'Your thoughts remain private, always.',
            position: 'bottom-right'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden selection:bg-primary/30 font-sans relative">
            {/* Header */}
            <header className="fixed top-0 w-full z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                        <Link to="/" className="text-xl font-bold tracking-tight hover:text-primary transition-colors">SendTheLetter</Link>
                    </div>
                    <nav className="hidden md:flex gap-8 items-center absolute left-1/2 -translate-x-1/2">
                        <Link to="/about" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">About</Link>
                        <Link to="/creator" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">Creator</Link>
                        <Link to="/services" className="text-sm font-medium text-primary transition-colors">Services</Link>
                        <Link to="/contact" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">Contact</Link>
                    </nav>
                    <Link to="/login" className="hidden md:block">
                        <Button variant="ghost" className="font-semibold text-white hover:text-primary hover:bg-white/5">Login</Button>
                    </Link>
                </div>
            </header>

            <main className="relative min-h-screen flex flex-col items-center justify-center pt-20">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

                {/* Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-16"
                    >
                        <h1 className="text-5xl md:text-8xl font-thin tracking-tight mb-4">
                            Pure <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Connection</span>
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light tracking-wide">
                            Immerse in meaningful communication with zero distractions and seamless design.
                        </p>
                    </motion.div>

                    <div className="relative max-w-5xl mx-auto h-[600px] md:h-[500px] flex items-center justify-center">
                        {/* Central Visual */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="relative z-20 w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border border-white/10 shadow-2xl shadow-primary/20"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent mix-blend-overlay z-10" />
                            <img
                                src="https://images.unsplash.com/photo-1516383748727-801659961c2c?q=80&w=800&auto=format&fit=crop"
                                alt="Connection"
                                className="w-full h-full object-cover opacity-80"
                            />

                            {/* Connecting Lines (Decorative) */}
                            <div className="absolute inset-0 border border-white/5 rounded-full animate-pulse" />
                        </motion.div>

                        {/* Features */}
                        <div className="absolute inset-0 pointer-events-none">
                            {features.map((feature, index) => {
                                const isLeft = feature.position.includes('left');
                                const isTop = feature.position.includes('top');

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: isLeft ? 50 : -50, y: isTop ? 50 : -50 }}
                                        animate={{ opacity: 1, x: 0, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.4 + (index * 0.1) }}
                                        className={`absolute pointer-events-auto flex flex-col gap-2 max-w-[200px] md:max-w-[250px]
                                            ${isLeft ? 'items-end text-right left-4 md:left-0' : 'items-start text-left right-4 md:right-0'}
                                            ${isTop ? 'top-0 md:top-10' : 'bottom-0 md:bottom-10'}
                                        `}
                                    >
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-primary backdrop-blur-sm">
                                            <feature.icon size={24} />
                                        </div>
                                        <h3 className="text-xl font-medium text-white">{feature.title}</h3>
                                        <p className="text-sm text-slate-400">{feature.desc}</p>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Connecting Lines SVG */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" style={{ zIndex: 10 }}>
                            <line x1="50%" y1="50%" x2="15%" y2="15%" stroke="url(#grad1)" strokeWidth="1" />
                            <line x1="50%" y1="50%" x2="85%" y2="15%" stroke="url(#grad1)" strokeWidth="1" />
                            <line x1="50%" y1="50%" x2="15%" y2="85%" stroke="url(#grad1)" strokeWidth="1" />
                            <line x1="50%" y1="50%" x2="85%" y2="85%" stroke="url(#grad1)" strokeWidth="1" />
                            <defs>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0 }} />
                                    <stop offset="50%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0 }} />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="mt-16 flex justify-center gap-8 text-slate-500"
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Zap size={20} />
                            <span className="text-xs uppercase tracking-widest">Fast</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Lock size={20} />
                            <span className="text-xs uppercase tracking-widest">Secure</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <MessageCircle size={20} />
                            <span className="text-xs uppercase tracking-widest">Social</span>
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Services;
