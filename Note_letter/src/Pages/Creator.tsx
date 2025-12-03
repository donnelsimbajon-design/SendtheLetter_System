import { motion } from 'framer-motion';
import { Github, Twitter, Mail, MapPin, Code, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

const Creator = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
            {/* Header */}
            <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                        <Link to="/" className="text-xl font-bold tracking-tight hover:text-primary transition-colors">SendTheLetter</Link>
                    </div>
                    <nav className="hidden md:flex gap-8 items-center absolute left-1/2 -translate-x-1/2">
                        <Link to="/about" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">About</Link>
                        <Link to="/creator" className="text-sm font-medium text-primary transition-colors">Creator</Link>
                        <Link to="/services" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">Services</Link>
                        <Link to="/contact" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">Contact</Link>
                    </nav>
                    <Link to="/login" className="hidden md:block">
                        <Button variant="ghost" className="font-semibold text-white hover:text-primary">Login</Button>
                    </Link>
                </div>
            </header>

            {/* Hero Section with Full Image */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/creator.jpg"
                        alt="Creator in nature"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                                The Creator
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-8 font-light">
                            Building meaningful connections through code, one letter at a time.
                        </p>

                        {/* Social Links */}
                        <div className="flex justify-center gap-4 mb-12">
                            <a href="#" className="p-3 rounded-full bg-white/10 hover:bg-primary/20 border border-white/20 hover:border-primary transition-all backdrop-blur-sm">
                                <Github size={20} />
                            </a>
                            <a href="#" className="p-3 rounded-full bg-white/10 hover:bg-primary/20 border border-white/20 hover:border-primary transition-all backdrop-blur-sm">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="p-3 rounded-full bg-white/10 hover:bg-primary/20 border border-white/20 hover:border-primary transition-all backdrop-blur-sm">
                                <Mail size={20} />
                            </a>
                        </div>

                        {/* Scroll Indicator */}
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-slate-400 text-sm"
                        >
                            <div className="w-6 h-10 border-2 border-slate-400/50 rounded-full mx-auto mb-2 flex items-start justify-center p-2">
                                <div className="w-1.5 h-3 bg-primary rounded-full" />
                            </div>
                            Scroll to explore
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* About Section */}
            <section className="relative py-32 bg-gradient-to-b from-slate-950 to-slate-900">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="grid md:grid-cols-3 gap-8"
                        >
                            {/* Card 1 */}
                            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Code className="text-primary" size={24} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Developer</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Crafting elegant solutions with modern web technologies. Passionate about clean code and user experience.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Heart className="text-primary" size={24} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Visionary</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Believing in the power of thoughtful communication. Creating spaces where emotions are preserved with care.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <MapPin className="text-primary" size={24} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Explorer</h3>
                                <p className="text-slate-400 leading-relaxed">
                                    Finding inspiration in nature's beauty. Always seeking new perspectives and pushing boundaries.
                                </p>
                            </div>
                        </motion.div>

                        {/* Philosophy Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="mt-20 text-center"
                        >
                            {/* Profile Image */}
                            <div className="mb-8 flex justify-center">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/30 shadow-2xl shadow-primary/20">
                                    <img
                                        src="/creator-profile.jpg"
                                        alt="Creator"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-bold mb-8">Philosophy</h2>
                            <div className="max-w-3xl mx-auto space-y-6 text-lg text-slate-300 leading-relaxed">
                                <p className="text-xl italic border-l-4 border-primary pl-6 text-left">
                                    "In a world of instant messages and fleeting notifications, I wanted to create something timeless—a digital sanctuary where words can breathe, feelings can settle, and connections can deepen."
                                </p>
                                <p className="text-slate-400">
                                    SendTheLetter was born from a simple observation: we've lost the art of patience in communication. This platform is my attempt to bring back the anticipation, the thoughtfulness, and the emotional weight of a letter that arrives at just the right moment.
                                </p>
                            </div>
                        </motion.div>

                        {/* Tech Stack */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="mt-20 p-10 rounded-3xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20"
                        >
                            <h3 className="text-2xl font-bold mb-6 text-center">Built With Modern Excellence</h3>
                            <div className="flex flex-wrap justify-center gap-4 text-slate-300">
                                <span className="px-4 py-2 rounded-full bg-white/10 border border-white/20">React</span>
                                <span className="px-4 py-2 rounded-full bg-white/10 border border-white/20">TypeScript</span>
                                <span className="px-4 py-2 rounded-full bg-white/10 border border-white/20">Tailwind CSS</span>
                                <span className="px-4 py-2 rounded-full bg-white/10 border border-white/20">Framer Motion</span>
                                <span className="px-4 py-2 rounded-full bg-white/10 border border-white/20">Zustand</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Creator;
