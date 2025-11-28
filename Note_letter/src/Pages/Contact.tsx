import { Link } from 'react-router-dom';
import { Send, Mail, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { motion } from 'framer-motion';

const Contact = () => {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
            {/* Header */}
            <header className="fixed top-0 w-full z-40 border-b border-white/5 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                        <span className="text-xl font-bold tracking-tight">SendTheLetter</span>
                    </Link>
                    <nav className="hidden md:flex gap-8 items-center">
                        <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</Link>
                        <Link to="/services" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Services</Link>
                        <Link to="/contact" className="text-sm font-medium text-primary transition-colors">Contact</Link>
                        <Link to="/login">
                            <Button variant="ghost" className="font-semibold">Login</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="pt-32 pb-20 relative min-h-screen flex items-center">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-start">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">Get in Touch</h1>
                            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
                                Have questions, feedback, or just want to say hello? We'd love to hear from you.
                                Drop us a message and we'll get back to you as soon as possible.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Email Us</h3>
                                        <p className="text-muted-foreground">hello@sendtheletter.com</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Location</h3>
                                        <p className="text-muted-foreground">Digital Space, Internet</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-card/50 backdrop-blur-md border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl"
                        >
                            <form className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium ml-1">Name</label>
                                    <Input
                                        type="text"
                                        id="name"
                                        className="bg-background/50 border-white/10 focus:border-primary/50 h-12"
                                        placeholder="Your Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium ml-1">Email</label>
                                    <Input
                                        type="email"
                                        id="email"
                                        className="bg-background/50 border-white/10 focus:border-primary/50 h-12"
                                        placeholder="your@email.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium ml-1">Message</label>
                                    <Textarea
                                        id="message"
                                        rows={5}
                                        className="bg-background/50 border-white/10 focus:border-primary/50 resize-none"
                                        placeholder="How can we help you?"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-xl text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all mt-4"
                                >
                                    Send Message <Send size={18} className="ml-2" />
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Contact;
