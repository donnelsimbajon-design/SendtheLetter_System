import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoteStore } from '../store/noteStore';
import Notecard from './Notecard';
import { Note } from '../types/note';
import LetterViewModal from './LetterViewModal';
import MapDashboard from './MapDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Check, X, Map as MapIcon, Grid } from 'lucide-react';
import { Button } from './ui/button';

const categories = ['All', 'Love', 'Friendship', 'Apology', 'Gratitude', 'Inspiration', 'Other'];

const DashboardWidget = () => {
    const navigate = useNavigate();
    const { publicLetters, fetchPublicLetters, isLoading } = useNoteStore();
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

    useEffect(() => {
        fetchPublicLetters();
    }, [fetchPublicLetters]);

    const handleNoteClick = (note: Note) => {
        setSelectedNote(note);
        setIsViewModalOpen(true);
    };

    const handleAuthorClick = (username: string) => {
        navigate(`/dashboard/profile/${username}`);
    };

    // Filter letters
    const filteredLetters = publicLetters.filter(letter => {
        const matchesCategory = selectedCategory === 'All' || letter.category === selectedCategory;
        const matchesSearch = letter.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (letter.title && letter.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (letter.authorName && letter.authorName.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-8 pt-8 px-4 md:px-8 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
            {/* Minimalist Search & Filter Bar */}
            <div className="max-w-2xl mx-auto relative z-20 w-full flex-shrink-0">
                <div className="relative flex items-center bg-card/80 backdrop-blur-md border border-white/10 rounded-full shadow-lg transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50">
                    <Search className="absolute left-4 text-muted-foreground" size={20} />

                    <input
                        type="text"
                        placeholder="Search letters..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none py-3.5 pl-12 pr-32 text-base focus:outline-none placeholder:text-muted-foreground/50 text-foreground"
                    />

                    <div className="absolute right-1.5 flex items-center">
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="p-2 text-muted-foreground hover:text-foreground transition-colors mr-1"
                            >
                                <X size={16} />
                            </button>
                        )}

                        <div className="h-6 w-px bg-white/10 mx-1" />

                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory !== 'All'
                                ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                }`}
                        >
                            <span className="max-w-[80px] truncate">
                                {selectedCategory === 'All' ? 'Filter' : selectedCategory}
                            </span>
                            <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Filter Dropdown */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 top-full mt-2 w-56 bg-card border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 p-1.5"
                            >
                                <div className="text-xs font-medium text-muted-foreground px-3 py-2">
                                    Filter by Category
                                </div>
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setIsFilterOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === category
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-foreground hover:bg-white/5'
                                            }`}
                                    >
                                        {category}
                                        {selectedCategory === category && <Check size={14} />}
                                    </button>
                                ))}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* View Toggle */}
            <div className="flex justify-end px-4 -mt-4 relative z-10">
                <div className="bg-white/50 backdrop-blur-sm border border-stone-200 p-1 rounded-full flex gap-1 shadow-sm">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                        title="Grid View"
                    >
                        <Grid size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('map')}
                        className={`p-2 rounded-full transition-all ${viewMode === 'map' ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
                        title="Map View"
                    >
                        <MapIcon size={18} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                {viewMode === 'map' ? (
                    <MapDashboard notes={filteredLetters} onNoteClick={handleNoteClick} />
                ) : (
                    <>
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="h-80 bg-card/50 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredLetters.length > 0 ? (
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {filteredLetters.map((note) => (
                                    <motion.div key={note.id} variants={item}>
                                        <Notecard
                                            note={note}
                                            onClick={handleNoteClick}
                                            onAuthorClick={handleAuthorClick}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-muted-foreground">
                                    No letters found matching your search.
                                </p>
                                {(selectedCategory !== 'All' || searchQuery) && (
                                    <Button
                                        variant="link"
                                        onClick={() => {
                                            setSelectedCategory('All');
                                            setSearchQuery('');
                                        }}
                                        className="mt-2 text-primary"
                                    >
                                        Clear filters
                                    </Button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <LetterViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                note={selectedNote}
                onAuthorClick={handleAuthorClick}
            />
        </div>
    );
};

export default DashboardWidget;
