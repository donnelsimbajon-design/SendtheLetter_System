import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Feather, Lock, Loader2, Printer } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import { getImageUrl } from '../../lib/utils';
import { Note } from '../../types/note';

const PublicLetterPage = () => {
    const { id } = useParams<{ id: string }>();
    const [letter, setLetter] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let active = true;
        const loadLetter = async () => {
            setLoading(true);
            setNotFound(false);
            try {
                const response = await axios.get(`${API_ENDPOINTS.letters}/public/${encodeURIComponent(id || '')}`);
                if (active) setLetter(response.data);
            } catch {
                if (active) setNotFound(true);
            } finally {
                if (active) setLoading(false);
            }
        };
        if (id) loadLetter();
        return () => { active = false; };
    }, [id]);

    useEffect(() => {
        if (letter) {
            document.title = `${letter.title || 'A letter'} | SendTheLetter`;
            const description = (letter.content || 'A letter shared on SendTheLetter').replace(/\s+/g, ' ').slice(0, 155);
            let meta = document.querySelector('meta[name="description"]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('name', 'description');
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', description);
        }
    }, [letter]);

    if (loading) return <main className="min-h-screen flex items-center justify-center bg-[#f6f1e9] text-[#263b35]"><Loader2 className="animate-spin" /> <span className="ml-2">Opening your letter…</span></main>;
    if (notFound || !letter) return <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f6f1e9] p-6 text-center text-[#263b35]"><Lock size={32} /><h1 className="font-serif text-3xl">This letter isn't available</h1><p className="max-w-md text-sm text-[#52645d]">It may be private, unpublished, or no longer available.</p><Link to="/" className="inline-flex items-center gap-2 rounded-full bg-[#263b35] px-5 py-3 text-white"><ArrowLeft size={16} /> Back to SendTheLetter</Link></main>;

    return (
        <main className="min-h-screen bg-[#f6f1e9] px-4 py-10 text-[#263b35]">
            <div className="mx-auto max-w-3xl">
                <div className="no-print flex items-center justify-between">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#52645d] hover:text-[#263b35]"><ArrowLeft size={16} /> SendTheLetter</Link>
                    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-[#d8cfc1] bg-[#fffdf8] px-4 py-2 text-sm text-[#263b35] hover:bg-white"><Printer size={15} /> Print / Save as PDF</button>
                </div>
                <article className="public-letter-sheet mt-8 overflow-hidden rounded-[2rem] border border-[#ded6c9] bg-[#fffdf8] shadow-xl">
                    {letter.imageUrl && <img src={getImageUrl(letter.imageUrl)} alt="" className="max-h-[420px] w-full object-cover" />}
                    <div className="p-7 sm:p-12">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#a06c56]"><Feather size={14} /> {letter.type || 'A shared letter'}</div>
                        <h1 className="mt-5 font-serif text-3xl leading-tight sm:text-5xl">{letter.title || 'A letter for you'}</h1>
                        <p className="mt-4 text-sm text-[#7c8179]">By {letter.isAnonymous ? 'Anonymous' : (letter.authorName || 'A SendTheLetter writer')}</p>
                        <div className="my-8 h-px bg-[#e9e2d8]" />
                        <div className="whitespace-pre-wrap break-words font-serif text-lg leading-8 text-[#394840]">{letter.content}</div>
                        <div className="mt-10 border-t border-[#e9e2d8] pt-6 text-xs text-[#8a8d84]">Shared with care on SendTheLetter.</div>
                    </div>
                </article>
            </div>
        </main>
    );
};

export default PublicLetterPage;
