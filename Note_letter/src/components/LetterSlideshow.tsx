import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Music, Shield, Star } from 'lucide-react';
import { Button } from './ui/button';

const letters = [
    {
        id: 1,
        type: 'Love Letter',
        icon: Heart,
        color: 'from-pink-500 to-rose-500',
        title: 'To My Future Self',
        preview: "I hope you're doing well. Remember that time we...",
        image: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=600&auto=format&fit=crop'
    },
    {
        id: 2,
        type: 'Gratitude',
        icon: Star,
        color: 'from-amber-400 to-orange-500',
        title: 'Thank You Mom',
        preview: "For all the sacrifices you made, I want to say...",
        image: 'https://images.unsplash.com/photo-1499744663557-3708d1453915?q=80&w=600&auto=format&fit=crop'
    },
    {
        id: 3,
        type: 'Apology',
        icon: Shield,
        color: 'from-blue-400 to-indigo-500',
        title: 'I am Sorry',
        preview: "I never meant to hurt you. I've been thinking...",
        image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=600&auto=format&fit=crop'
    },
    {
        id: 4,
        type: 'Musical Note',
        icon: Music,
        color: 'from-purple-500 to-violet-500',
        title: 'Our Song',
        preview: "Every time I hear this track, I think of you...",
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop'
    }
];

const LetterSlideshow = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [currentIndex]);

    const nextSlide = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % letters.length);
    };

    const prevSlide = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + letters.length) % letters.length);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8,
            rotateY: direction > 0 ? 45 : -45,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            rotateY: 0,
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8,
            rotateY: direction < 0 ? 45 : -45,
        }),
    };

    return (
        <div className="relative w-full max-w-5xl mx-auto h-[500px] flex items-center justify-center perspective-1000">
            <div className="absolute inset-0 flex items-center justify-between z-20 px-4 pointer-events-none">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevSlide}
                    className="pointer-events-auto rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-md text-white border border-white/10"
                >
                    <ChevronLeft size={24} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextSlide}
                    className="pointer-events-auto rounded-full bg-background/20 hover:bg-background/40 backdrop-blur-md text-white border border-white/10"
                >
                    <ChevronRight size={24} />
                </Button>
            </div>

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                            rotateY: { duration: 0.4 }
                        }}
                        className="absolute w-[300px] md:w-[800px] h-[400px] bg-card rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row"
                    >
                        {/* Image Section */}
                        <div className="w-full md:w-1/2 h-48 md:h-full relative overflow-hidden">
                            <img
                                src={letters[currentIndex].image}
                                alt={letters[currentIndex].type}
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                            />
                            <div className={`absolute inset-0 bg-gradient-to-br ${letters[currentIndex].color} opacity-40 mix-blend-overlay`} />
                            <div className="absolute bottom-4 left-4 text-white">
                                <span className="px-3 py-1 rounded-full bg-black/30 backdrop-blur-md text-xs font-medium border border-white/20">
                                    {letters[currentIndex].type}
                                </span>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-card/95 backdrop-blur-xl relative">
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${letters[currentIndex].color} opacity-10 blur-3xl rounded-full -mr-10 -mt-10`} />

                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${letters[currentIndex].color} flex items-center justify-center text-white mb-6 shadow-lg`}>
                                {(() => {
                                    const Icon = letters[currentIndex].icon;
                                    return <Icon size={24} />;
                                })()}
                            </div>

                            <h3 className="text-3xl font-bold mb-2 text-foreground">{letters[currentIndex].title}</h3>
                            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                                "{letters[currentIndex].preview}"
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentIndex}`} alt="Avatar" />
                                </div>
                                <div className="text-sm">
                                    <p className="font-medium text-foreground">Anonymous User</p>
                                    <p className="text-muted-foreground text-xs">Sent via SendTheLetter</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Dots */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {letters.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setDirection(index > currentIndex ? 1 : -1);
                            setCurrentIndex(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-primary/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default LetterSlideshow;
