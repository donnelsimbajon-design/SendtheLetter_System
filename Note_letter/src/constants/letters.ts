import { Heart, Music, Shield, Star } from 'lucide-react';

export const letters = [
    {
        id: 1,
        type: 'Love Letter',
        icon: Heart,
        color: 'from-pink-500 to-rose-500',
        title: 'To My Future Self',
        preview: "I hope you're doing well. Remember that time we...",
        content: "I hope you're doing well. Remember that time we sat under the stars and dreamed about the future? I wonder if you've achieved those dreams. Don't be too hard on yourself if things didn't go exactly as planned. You are loved.",
        image: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=600&auto=format&fit=crop'
    },
    {
        id: 2,
        type: 'Gratitude',
        icon: Star,
        color: 'from-amber-400 to-orange-500',
        title: 'Thank You Mom',
        preview: "For all the sacrifices you made, I want to say...",
        content: "For all the sacrifices you made, I want to say thank you. I know I didn't say it enough growing up, but I see it now. Your strength and love have shaped me into who I am today.",
        image: 'https://images.unsplash.com/photo-1499744663557-3708d1453915?q=80&w=600&auto=format&fit=crop'
    },
    {
        id: 3,
        type: 'Apology',
        icon: Shield,
        color: 'from-blue-400 to-indigo-500',
        title: 'I am Sorry',
        preview: "I never meant to hurt you. I've been thinking...",
        content: "I never meant to hurt you. I've been thinking about our last conversation and I realize I was wrong. I value our friendship more than my pride. I hope you can forgive me.",
        image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=600&auto=format&fit=crop'
    },
    {
        id: 4,
        type: 'Musical Note',
        icon: Music,
        color: 'from-purple-500 to-violet-500',
        title: 'Our Song',
        preview: "Every time I hear this track, I think of you...",
        content: "Every time I hear this track, I think of you and the summer we spent together. Music has a way of bringing back memories so vividly. I hope this song brings a smile to your face.",
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop'
    }
];
