import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Shield, Zap, Heart, Globe, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { MouseEvent } from 'react';
import LetterSlideshow from '../components/LetterSlideshow';

const Hero3DCard = () => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-100, 100], [30, -30]);
    const rotateY = useTransform(x, [-100, 100], [-30, 30]);

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

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-64 h-80 md:w-80 md:h-96 bg-gradient-to-br from-primary/80 to-purple-600/80 rounded-xl shadow-2xl cursor-pointer backdrop-blur-md border border-white/10"
        >
            <div
                style={{ transform: "translateZ(75px)" }}
                className="absolute inset-4 bg-black/20 rounded-lg border border-white/10 flex flex-col items-center justify-center p-6 text-center"
            >
                <Mail className="w-16 h-16 text-white mb-4 drop-shadow-lg" />
                <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md">Your Letter</h3>
                <p className="text-white/80 text-sm">Sent safely across the digital universe.</p>
            </div>
            <div
                style={{ transform: "translateZ(50px)" }}
                className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-500/30 rounded-full blur-2xl"
            />
            <div
                style={{ transform: "translateZ(50px)" }}
                className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl"
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
                    <nav className="hidden md:flex gap-8 items-center">
                        <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</Link>
                        <Link to="/services" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Services</Link>
                        <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</Link>
                        <Link to="/login">
                            <Button variant="ghost" className="font-semibold">Login</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
                </div>

                <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
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
                        className="flex justify-center md:justify-end perspective-1000"
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
                        <p className="text-muted-foreground text-lg">See how others are using SendTheLetter to connect.</p>
                    </div>
                    <LetterSlideshow />
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
        </div>
    );
};

export default Home;
