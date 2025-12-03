import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';

const About = () => {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
            {/* Header */}
            <header className="fixed top-0 w-full z-40 border-b border-white/5 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                        <span className="text-xl font-bold tracking-tight">SendTheLetter</span>
                    </Link>
                    <nav className="hidden md:flex gap-8 items-center absolute left-1/2 -translate-x-1/2">
                        <Link to="/about" className="text-sm font-medium text-primary transition-colors">About</Link>
                        <Link to="/creator" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Creator</Link>
                        <Link to="/services" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Services</Link>
                        <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</Link>
                    </nav>
                    <Link to="/login" className="hidden md:block">
                        <Button variant="ghost" className="font-semibold">Login</Button>
                    </Link>
                </div>
            </header>

            <main className="pt-32 pb-20 relative">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px]" />
                </div>

                <div className="container mx-auto px-6 max-w-4xl relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">Our Story</h1>
                        <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
                    </motion.div>

                    <div className="space-y-12 text-lg md:text-xl text-muted-foreground leading-relaxed">
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="first-letter:text-5xl first-letter:font-bold first-letter:text-primary first-letter:mr-3 first-letter:float-left"
                        >
                            <span className="text-foreground font-medium">SendTheLetter</span> is a minimalist platform designed to help you express your feelings
                            through digital letters. In a world of instant messaging and fleeting notifications, we
                            believe in the power of a thoughtful, deliberate note.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="p-8 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm shadow-xl"
                        >
                            <p className="italic text-foreground/80">
                                "Inspired by the simplicity of traditional letter writing, we've created a space where
                                you can compose messages that matter, attach a song that sets the mood, and
                                share them with the people who mean the most to you."
                            </p>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            Whether it's a confession of love, a word of encouragement, or a simple "thank you",
                            SendTheLetter provides the canvas for your emotions. We ensure your words are delivered
                            safely, securely, and exactly when you intend them to be heard.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mt-20 text-center"
                    >
                        <Link to="/signup">
                            <Button size="lg" className="rounded-full px-10 py-6 text-lg shadow-lg hover:scale-105 transition-transform">
                                Start Writing Today
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default About;
