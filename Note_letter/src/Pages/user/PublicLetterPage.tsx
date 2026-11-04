import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CommentsPanel from '../../components/CommentsPanel';
import LetterBookReader from '../../components/LetterBookReader';
import axios from 'axios';
import { ArrowLeft, Lock, Loader2, Printer, Download, MessageCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import { Note } from '../../types/note';

const PublicLetterPage = () => {
    const { id: routeToken } = useParams();
    const token = new URLSearchParams(window.location.search).get('s') || routeToken || '';
    const [letter, setLetter] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [imageStatus, setImageStatus] = useState('');
    const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false);

    useEffect(() => {
        let active = true;
        const loadLetter = async () => {
            setLoading(true);
            setNotFound(false);
            try {
                const response = await axios.get(`${API_ENDPOINTS.letters}/public/${encodeURIComponent(token)}`);
                if (active) setLetter(response.data);
            } catch {
                if (active) setNotFound(true);
            } finally {
                if (active) setLoading(false);
            }
        };
        if (/^[a-f0-9]{48}$/.test(token)) loadLetter(); else { setLoading(false); setNotFound(true); }
        return () => { active = false; };
    }, [token]);

    useEffect(() => {
        if (!mobileCommentsOpen) return;
        const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileCommentsOpen(false); };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [mobileCommentsOpen]);

    const downloadShareImage = () => {
        if (!letter) return;
        setImageStatus('Preparing your letter image…');

        const wrapText = (value: string, limit: number) => {
            const words = value.trim().split(/\s+/).filter(Boolean);
            if (!words.length) return [''];
            const lines: string[] = [];
            let line = '';
            words.forEach((word) => {
                const next = line ? `${line} ${word}` : word;
                if (next.length > limit && line) {
                    lines.push(line);
                    line = word;
                } else {
                    line = next;
                }
            });
            if (line) lines.push(line);
            return lines;
        };
        const escapeXml = (value: string) => value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');

        const titleLines = wrapText(letter.title || 'A letter for you', 34).slice(0, 2);
        const allContentLines = (letter.content || '')
            .split(/\r?\n/)
            .flatMap((paragraph) => paragraph.trim() ? wrapText(paragraph, 48) : ['']);
        const contentLines = allContentLines.slice(0, 20);
        if ((allContentLines.length > 20 || (letter.content || '').length > 850) && contentLines.length) {
            contentLines[contentLines.length - 1] = `${contentLines[contentLines.length - 1].slice(0, 44)}…`;
        }

        const titleSvg = titleLines.map((line, index) =>
            `<text x="92" y="${260 + index * 54}" font-family="Georgia,serif" font-size="42" fill="#263b35">${escapeXml(line)}</text>`
        ).join('');
        const contentSvg = contentLines.map((line, index) =>
            `<text x="92" y="${430 + index * 38}" font-family="Georgia,serif" font-size="25" fill="#394840">${escapeXml(line)}</text>`
        ).join('');
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
            <rect width="1080" height="1350" fill="#f6f1e9"/>
            <rect x="42" y="42" width="996" height="1266" rx="34" fill="#fffdf8" stroke="#ded6c9" stroke-width="2"/>
            <text x="92" y="145" font-family="Arial,sans-serif" font-size="22" letter-spacing="7" fill="#a06c56">SENDTHELETTER</text>
            <text x="92" y="205" font-family="Arial,sans-serif" font-size="18" letter-spacing="3" fill="#8a8d84">${escapeXml(letter.type || 'A SHARED LETTER').toUpperCase()}</text>
            ${titleSvg}
            <text x="92" y="365" font-family="Arial,sans-serif" font-size="17" fill="#7c8179">By ${escapeXml(letter.isAnonymous ? 'Anonymous' : (letter.authorName || 'A SendTheLetter writer'))}</text>
            <path d="M92 395 H988" stroke="#e9e2d8" stroke-width="2"/>
            ${contentSvg}
            <text x="92" y="1250" font-family="Arial,sans-serif" font-size="16" fill="#8a8d84">Shared with care on SendTheLetter</text>
        </svg>`;

        const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1350;
            const context = canvas.getContext('2d');
            if (!context) {
                URL.revokeObjectURL(svgUrl);
                setImageStatus('Your browser could not prepare the image.');
                return;
            }
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(svgUrl);
                if (!blob) {
                    setImageStatus('Image export failed. Please try again.');
                    return;
                }
                const imageUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `sendtheletter-${token.slice(0,12)}.png`;
                link.click();
                URL.revokeObjectURL(imageUrl);
                setImageStatus('Your share image is ready.');
            }, 'image/png');
        };
        image.onerror = () => {
            URL.revokeObjectURL(svgUrl);
            setImageStatus('Image export failed. Please try again.');
        };
        image.src = svgUrl;
    };

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
    if (notFound || !letter) return <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f6f1e9] p-6 text-center text-[#263b35]"><Lock size={32} /><h1 className="font-serif text-3xl">This letter isn't available</h1><p className="max-w-md text-sm text-[#52645d]">The letter may be private or unavailable. Ask the author for a fresh, secure share link.</p><Link to="/" className="inline-flex items-center gap-2 rounded-full bg-[#263b35] px-5 py-3 text-white"><ArrowLeft size={16} /> Back to SendTheLetter</Link></main>;

    return (
        <main className="min-h-screen bg-[#f6f1e9] px-4 py-10 text-[#263b35]">
            <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[370px_minmax(0,1fr)] lg:items-start lg:gap-7">
                <aside className="no-print hidden lg:sticky lg:top-5 lg:block lg:h-[calc(100vh-2.5rem)] lg:min-h-[540px]" aria-label="Letter comments">
                    <CommentsPanel shareToken={token} className="rounded-[1.75rem] border border-[#e3d8cd] shadow-xl" />
                </aside>
                <div className="mx-auto w-full max-w-3xl min-w-0">
                <div className="no-print flex flex-wrap items-center justify-between gap-2">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#52645d] hover:text-[#263b35]"><ArrowLeft size={16} /> SendTheLetter</Link>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={downloadShareImage} className="inline-flex items-center gap-2 rounded-full border border-[#d8cfc1] bg-[#fffdf8] px-4 py-2 text-sm text-[#263b35] hover:bg-white"><Download size={15} /> Download image</button>
                        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-[#d8cfc1] bg-[#fffdf8] px-4 py-2 text-sm text-[#263b35] hover:bg-white"><Printer size={15} /> Print / Save as PDF</button>
                    </div>
                </div>
                {!letter.isAnonymous && letter.authorName && letter.authorName !== 'Unknown' && <Link to={`/writers/${encodeURIComponent(letter.authorName)}`} className="no-print mt-4 inline-flex rounded-full border border-[#d8cfc1] bg-white px-4 py-2 text-sm font-semibold text-[#263b35] hover:underline">Visit {letter.authorName}'s profile</Link>}
                {imageStatus && <p role="status" className="no-print mt-2 text-right text-xs text-[#52645d]">{imageStatus}</p>}
                <article className="stl-depth-paper stl-depth-static public-letter-sheet mt-7">
                    <LetterBookReader
                        title={letter.title}
                        content={letter.content}
                        letterPages={letter.letterPages}
                        category={letter.type || letter.category}
                        authorName={letter.authorName}
                        isAnonymous={letter.isAnonymous}
                        recipientName={letter.recipientName}
                        font={letter.font}
                        backgroundImage={letter.backgroundImage}
                        coverImage={letter.imageUrl}
                    />
                </article>
                </div>
            </div>
            <button type="button" onClick={() => setMobileCommentsOpen(true)} className="no-print fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#263b35] px-5 py-3 text-sm font-semibold text-white shadow-2xl hover:bg-[#375747] lg:hidden"><MessageCircle size={18} /> Comments & gifts</button>
            {mobileCommentsOpen && <div className="no-print fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Comments drawer">
                <button type="button" aria-label="Close comments drawer" onClick={() => setMobileCommentsOpen(false)} className="absolute inset-0 bg-black/55" />
                <aside className="absolute inset-y-0 left-0 w-[min(420px,96vw)] overflow-hidden bg-white shadow-2xl">
                    <CommentsPanel shareToken={token} onCollapse={() => setMobileCommentsOpen(false)} />
                </aside>
            </div>}
        </main>
    );
};

export default PublicLetterPage;
