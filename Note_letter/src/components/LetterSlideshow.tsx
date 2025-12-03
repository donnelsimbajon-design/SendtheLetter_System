import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

import { letters as defaultLetters } from '../constants/letters';

interface LetterSlideshowProps {
    letters?: any[];
    onNoteClick?: (note: any) => void;
}

const LetterSlideshow = ({ letters: propLetters, onNoteClick }: LetterSlideshowProps) => {
    const displayLetters = propLetters || defaultLetters;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [currentIndex, displayLetters]);

    const nextSlide = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % displayLetters.length);
    };

    const prevSlide = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + displayLetters.length) % displayLetters.length);
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

    if (!displayLetters || displayLetters.length === 0) {
        return <div className="text-center text-muted-foreground">No letters found.</div>;
    }

    const currentLetter = displayLetters[currentIndex];

    return (
        <div className="relative w-full max-w-2xl mx-auto h-[600px] flex items-center justify-center perspective-1000">
            <div className="absolute inset-0 flex items-center justify-between z-20 px-4 pointer-events-none">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevSlide}
                    className="pointer-events-auto rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20"
                >
                    <ChevronLeft size={24} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextSlide}
                    className="pointer-events-auto rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20"
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
                        className="absolute w-[90%] max-w-md h-[500px] rounded-3xl shadow-2xl overflow-hidden border-2 border-white/20 cursor-pointer"
                        onClick={() => onNoteClick && onNoteClick(currentLetter)}
                        style={{
                            background: `linear-gradient(135deg, 
                                hsl(var(--primary) / 0.15) 0%, 
                                hsl(var(--primary) / 0.05) 50%, 
                                transparent 100%),
                                linear-gradient(180deg, 
                                rgba(30, 41, 59, 0.95) 0%, 
                                rgba(15, 23, 42, 0.98) 100%)`,
                        }}
                    >
                        {/* Gradient Background Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-slate-950/80" />

                        {/* Inner Card Border Glow */}
                        <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                        <div className="relative h-full flex flex-col items-center justify-center p-10 text-center">
                            {/* Circular Image */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="mb-8"
                            >
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl shadow-primary/20 relative">
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
                                transition={{ delay: 0.3, duration: 0.5 }}
                                className="text-4xl font-bold mb-4 text-white"
                            >
                                {currentLetter.title}
                            </motion.h3>

                            {/* Quote/Preview */}
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.5 }}
                                className="text-lg text-slate-300 leading-relaxed max-w-sm mb-8 italic"
                            >
                                "{currentLetter.preview}"
                            </motion.p>

                            {/* Type Badge */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            >
                                <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-sm font-medium border border-white/20 text-white">
                                    {currentLetter.type}
                                </span>
                            </motion.div>

                            {/* Read Button */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                                className="mt-auto"
                            >
                                <Button
                                    variant="secondary"
                                    className="pointer-events-auto bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white"
                                >
                                    Read Full Letter
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Dots */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {displayLetters.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setDirection(index > currentIndex ? 1 : -1);
                            setCurrentIndex(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-primary w-6' : 'bg-white/30 hover:bg-primary/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default LetterSlideshow;
