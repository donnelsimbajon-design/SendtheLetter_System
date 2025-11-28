import { Link } from 'react-router-dom';
import { PenTool, Music, Share2, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { MouseEvent } from 'react';

const ServiceCard3D = ({ icon: Icon, title, desc, index }: { icon: any, title: string, desc: string, index: number }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-100, 100], [15, -15]);
    const rotateY = useTransform(x, [-100, 100], [-15, 15]);

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
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="group relative h-full bg-card/40 border border-white/5 rounded-2xl p-8 backdrop-blur-sm hover:bg-card/60 transition-colors cursor-pointer"
        >
            <div style={{ transform: "translateZ(50px)" }} className="mb-6 inline-block p-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                <Icon size={32} strokeWidth={1.5} />
            </div>
            <h3 style={{ transform: "translateZ(30px)" }} className="text-2xl font-bold mb-4 text-foreground">{title}</h3>
            <p style={{ transform: "translateZ(20px)" }} className="text-muted-foreground leading-relaxed">{desc}</p>

            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.div>
    );
};

const Services = () => {
    const services = [
        {
            icon: PenTool,
            title: 'Digital Letters',
            desc: 'Compose beautiful, minimalist notes with our distraction-free editor. Customize fonts, colors, and styles to match your emotion.'
        },
        {
            icon: Music,
            title: 'Music Integration',
            desc: 'Attach a Spotify or YouTube link to set the perfect atmosphere. The music plays automatically when your letter is opened.'
        },
        {
            icon: Share2,
            title: 'Easy Sharing',
            desc: 'Generate unique, secure links to share your notes instantly via any platform. No account required for recipients.'
        },
        {
            icon: Lock,
            title: 'Private & Secure',
            desc: 'Your notes are encrypted and stored securely. You have full control over visibility and can delete them at any time.'
        }
    ];

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
                        <Link to="/services" className="text-sm font-medium text-primary transition-colors">Services</Link>
                        <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</Link>
                        <Link to="/login">
                            <Button variant="ghost" className="font-semibold">Login</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="pt-32 pb-20 relative">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-20"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">Our Services</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Simple, powerful tools designed to help you connect meaningfully.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto perspective-1000">
                        {services.map((service, index) => (
                            <ServiceCard3D key={index} {...service} index={index} />
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-24 text-center p-12 rounded-3xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-white/5"
                    >
                        <h2 className="text-3xl font-bold mb-4">Ready to experience it?</h2>
                        <p className="text-muted-foreground mb-8">Join thousands of users writing their stories today.</p>
                        <Link to="/signup">
                            <Button size="lg" className="rounded-full px-10 py-6 text-lg shadow-lg hover:shadow-primary/20 transition-all">
                                Create Your Account
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Services;
