import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Globe, Lock, Heart, Star, Music } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { letters } from '../constants/letters';
import { MouseEvent } from 'react';
import LetterSlideshow from '../components/LetterSlideshow';
import { Input } from '../components/ui/input';
import { Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../components/ui/dialog";

const Hero3DCard = () => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const [currentIndex, setCurrentIndex] = useState(0);

    const rotateX = useTransform(y, [-100, 100], [30, -30]);
    const rotateY = useTransform(x, [-100, 100], [-30, 30]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % letters.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct * 200);
        y.set(yPct * 200);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    console.log('Home rendering', { letters, currentIndex });
    const currentLetter = letters[currentIndex];

    if (!currentLetter) {
        console.error('No letter found at index', currentIndex);
        return null;
    }

    const Icon = currentLetter.icon;

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                background: `linear-gradient(135deg, 
                    hsl(var(--primary) / 0.15) 0%, 
                    hsl(var(--primary) / 0.05) 50%, 
                    transparent 100%),
                    linear-gradient(180deg, 
                    rgba(30, 41, 59, 0.95) 0%, 
                    rgba(15, 23, 42, 0.98) 100%)`,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-[450px] h-80 md:w-[520px] md:h-96 rounded-3xl shadow-2xl cursor-pointer border-2 border-white/20 overflow-hidden"
        >
            {/* Gradient Background Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-slate-950/80" />

            {/* Inner Card Border Glow */}
            <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    style={{ transform: "translateZ(50px)" }}
                    className="relative h-full flex flex-col items-center justify-center p-8 text-center"
                >
                    {/* Type Badge at Top */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="mb-6"
                    >
                        <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium border border-white/20 text-white uppercase tracking-wider">
                            {currentLetter.type}
                        </span>
                    </motion.div>

                    {/* Circular Image */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="mb-6"
                    >
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl shadow-primary/20 relative">
                            <img
                                src={currentLetter.image}
                                alt={currentLetter.type}
                                className="w-full h-full object-cover"
                            />
                            <div className={`absolute inset-0 bg-gradient-to-br ${currentLetter.color} opacity-20 mix-blend-overlay`} />
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h3
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-3xl font-bold text-white mb-3"
                    >
                        {currentLetter.title}
                    </motion.h3>

                    {/* Preview Quote */}
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="text-sm text-slate-300 italic leading-relaxed"
                    >
                        "{currentLetter.preview}"
                    </motion.p>
                </motion.div>
            </AnimatePresence>

            {/* Decorative blur orbs */}
            <div
                style={{ transform: "translateZ(30px)" }}
                className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none"
            />
            <div
                style={{ transform: "translateZ(30px)" }}
                className="absolute -top-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none"
            />
        </motion.div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -10 }}
            className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card/80 transition-colors"
        >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Icon size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground">{desc}</p>
        </motion.div>
    );
};

const Home = () => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [selectedNote, setSelectedNote] = useState<any>(null);
    const [showNoteDialog, setShowNoteDialog] = useState(false);

    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    const [selectedMood, setSelectedMood] = useState('all');

    const moods = [
        { id: 'all', label: 'All', icon: Globe, color: 'text-foreground', bg: 'bg-foreground/5', border: 'border-foreground/10' },
        { id: 'Love Letter', label: 'Love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
        { id: 'Gratitude', label: 'Gratitude', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { id: 'Apology', label: 'Apology', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { id: 'Musical Note', label: 'Music', icon: Music, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    ];

    const filteredLetters = letters.filter(letter => {
        const matchesSearch = letter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            letter.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
            letter.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMood = selectedMood === 'all' || letter.type === selectedMood;
        return matchesSearch && matchesMood;
    });

    const handleNoteClick = (note: any) => {
        if (!isAuthenticated) {
            setShowLoginDialog(true);
        } else {
            setSelectedNote(note);
            setShowNoteDialog(true);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-50"
                style={{ scaleX }}
            />

            {/* Header */}
            <header className="fixed top-0 w-full z-40 border-b border-white/5 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                        <span className="text-xl font-bold tracking-tight">SendTheLetter</span>
                    </div>
                    <nav className="hidden md:flex gap-8 items-center absolute left-1/2 -translate-x-1/2">
                        <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</Link>
                        <Link to="/creator" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Creator</Link>
                        <Link to="/services" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Services</Link>
                        <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</Link>
                    </nav>
                    <Link to="/login" className="hidden md:block">
                        <Button variant="ghost" className="font-semibold">Login</Button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
                </div>

                <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10 max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
                            Send a letter to <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                                the future.
                            </span>
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
                            Write meaningful letters to yourself or others. Encrypted, anonymous, and delivered exactly when you want.
                        </p>
                        <div className="flex gap-4">
                            <Link to="/signup">
                                <Button size="lg" className="rounded-full px-8 text-lg h-14 gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                                    Start Writing <ArrowRight size={20} />
                                </Button>
                            </Link>
                            <Link to="/about">
                                <Button variant="outline" size="lg" className="rounded-full px-8 text-lg h-14 border-2 hover:bg-secondary/50">
                                    Learn More
                                </Button>
                            </Link>
                        </div>

                        <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground font-medium">
                            <div className="flex items-center gap-2">
                                <Shield size={18} className="text-primary" /> Secure
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe size={18} className="text-primary" /> Global
                            </div>
                            <div className="flex items-center gap-2">
                                <Heart size={18} className="text-primary" /> Free
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="flex justify-center md:justify-start perspective-1000 md:pl-8"
                    >
                        <Hero3DCard />
                    </motion.div>
                </div>
            </section>

            {/* Slideshow Section */}
            <section className="py-20 relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Examples of Love</h2>
                        <p className="text-muted-foreground text-lg mb-8">See how others are using SendTheLetter to connect.</p>

                        {/* Mood Explorer Chips */}
                        <div className="flex flex-wrap justify-center gap-3 mb-8">
                            {moods.map((mood) => {
                                const Icon = mood.icon;
                                const isSelected = selectedMood === mood.id;
                                return (
                                    <button
                                        key={mood.id}
                                        onClick={() => setSelectedMood(mood.id)}
                                        className={`
                                            flex items-center gap-2 px-6 py-3 rounded-full border transition-all duration-300
                                            ${isSelected
                                                ? `${mood.bg} ${mood.border} ${mood.color} shadow-lg scale-105`
                                                : 'bg-card/30 border-white/5 text-muted-foreground hover:bg-card/50 hover:text-foreground'
                                            }
                                        `}
                                    >
                                        <Icon size={18} className={isSelected ? 'animate-pulse' : ''} />
                                        <span className="font-medium">{mood.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="max-w-md mx-auto relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search public letters..."
                                className="pl-10 bg-background/50 backdrop-blur-sm border-white/10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <LetterSlideshow letters={filteredLetters} onNoteClick={handleNoteClick} />
                </div>
            </section>

            {/* Features Section */}
            <section className="py-32 relative bg-secondary/20">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Why SendTheLetter?</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                            We provide a safe haven for your thoughts, ensuring they reach their destination through time and space.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Lock}
                            title="End-to-End Encrypted"
                            desc="Your letters are encrypted before they leave your device. Only the recipient can read them."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Instant Delivery"
                            desc="Choose exactly when your letter arrives. Seconds, days, or years from now."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={Heart}
                            title="Emotional Connection"
                            desc="Reconnect with your past self or surprise a loved one with a message from the past."
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5" />
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to write your story?</h2>
                        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                            Join thousands of others who are capturing moments in time.
                        </p>
                        <Link to="/signup">
                            <Button size="lg" className="rounded-full px-12 py-8 text-xl shadow-xl hover:scale-105 transition-transform">
                                Create Your Account
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-border/10 bg-background">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-8 w-8 grayscale opacity-50" />
                        <span className="text-sm font-semibold text-muted-foreground">© 2024 SendTheLetter</span>
                    </div>
                    <div className="flex gap-8 text-sm text-muted-foreground">
                        <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
                        <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
                    </div>
                </div>
            </footer>
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Login Required</DialogTitle>
                        <DialogDescription>
                            You need to be logged in to view the full content of this letter.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLoginDialog(false)}>Cancel</Button>
                        <Button onClick={() => navigate('/login')}>Login / Signup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedNote?.icon && <selectedNote.icon className="w-5 h-5 text-primary" />}
                            {selectedNote?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedNote?.type} • {selectedNote?.preview}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 text-lg leading-relaxed">
                        {selectedNote?.content}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Home;
