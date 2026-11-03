import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import CharacterBadge from './CharacterBadge';
import LetterFlowEditor from './LetterFlowEditor';
import { useAuthStore } from '../store/authStore';
import { useWriterPreferences } from '../store/writerPreferences';
import { cn } from '../lib/utils';
import { API_ENDPOINTS } from '../config/api';
import { useLetterBook } from '../hooks/useLetterBook';
import { parseLetterMusicLink } from '../lib/letterMusicLink';

interface LetterEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void> | void;
    initialData?: any;
    starterTemplate?: string;
    onDraftSaved?: () => Promise<void> | void;
    onPublished?: (status?: string, isPublic?: boolean) => Promise<void> | void;
}

const fonts = [
    { name: 'Classic serif', value: 'font-serif', short: 'Classic' },
    { name: 'Modern sans', value: 'font-sans', short: 'Modern' },
    { name: 'Typewriter', value: 'font-mono', short: 'Typed' },
    { name: 'Handwritten', value: 'font-[cursive]', short: 'Handwritten' },
];

const categories = ['Love', 'Friendship', 'Gratitude', 'Apology', 'Reflection', 'Celebration', 'Other'];
const templates = [
    { value: 'gratitude', name: 'A heartfelt thank you', category: 'Gratitude', title: 'Thank you for being you', content: 'I wanted to take a moment to say thank you for…\n\nOne thing I appreciate about you is…\n\nIt means more than you know.' },
    { value: 'apology', name: 'An honest apology', category: 'Apology', title: 'I owe you an apology', content: 'I have been thinking about what happened, and I want to acknowledge…\n\nI am sorry for…\n\nI hope we can find a way forward when you are ready.' },
    { value: 'future-self', name: 'A note to future me', category: 'Reflection', title: 'Dear future me', content: 'Right now, life looks like…\n\nI hope you remember…\n\nPlease keep making time for the things that matter.\n\nI am proud of how far you have come.' },
    { value: 'hello', name: 'A little hello', category: 'Friendship', title: 'Just wanted to say hello', content: 'You crossed my mind today, and I wanted to reach out.\n\nI hope you have been…\n\nHere is something I wanted you to know…' },
];

const papers = [
    { name: 'Ivory', value: '#fdfbf7', className: 'bg-[#fdfbf7]' },
    { name: 'Peach', value: 'linear-gradient(135deg, #fff5e6 0%, #ffe4cc 100%)', className: 'bg-gradient-to-br from-[#fff5e6] to-[#ffe4cc]' },
    { name: 'Blue', value: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', className: 'bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb]' },
    { name: 'Lilac', value: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', className: 'bg-gradient-to-br from-[#f3e5f5] to-[#e1bee7]' },
    { name: 'Sage', value: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', className: 'bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9]' },
    { name: 'Rose', value: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)', className: 'bg-gradient-to-br from-[#fce4ec] to-[#f8bbd0]' },
];

const localDateInput = (value?: string | Date | null) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
};
const utcDate = (value: string) => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toISOString() : null;

const LetterEditorModal: React.FC<LetterEditorModalProps> = ({ isOpen, onClose, onSubmit, initialData, starterTemplate, onDraftSaved, onPublished }) => {
    const user = useAuthStore(s => s.user);
    const preferences = useWriterPreferences(s => s.preferences);

    const [title, setTitle] = useState('');
    const { pages, pageIndex, setPageIndex, resetBook, updateText, updateComposedText, addPage, removeBlank, addPhoto, setCaption, removeImage, updateImageLayout, bookError, setBookError, content, wordCount } = useLetterBook();
    const [recipientName, setRecipientName] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [category, setCategory] = useState('Other');
    const [font, setFont] = useState('font-serif');
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [backgroundImage, setBackgroundImage] = useState(papers[0].value);
    const [imageUrl, setImageUrl] = useState('');
    const [spotifyLink, setSpotifyLink] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [isTimeCapsule, setIsTimeCapsule] = useState(false);
    const [openDate, setOpenDate] = useState('');
    const [controlsOpen, setControlsOpen] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState('');
    const [notice, setNotice] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    const draftIdRef = useRef<string | null>(null);
    const pendingSave = useRef<Promise<boolean> | null>(null);
    const publishing = useRef(false);
    const revision = useRef(0);
    const caretAnchor = useRef(0);

    const editingPublished = Boolean(initialData?.id && initialData.status !== 'draft');
    const markDirty = () => { revision.current += 1; setIsDirty(true); setConfirming(false); };

    useEffect(() => {
        if (!isOpen) return;
        publishing.current = false;
        draftIdRef.current = initialData?.status === 'draft' && initialData.id ? String(initialData.id) : null;
        const starter = !initialData ? templates.find(template => template.value === starterTemplate) : undefined;
        setTitle(initialData?.title || starter?.title || '');
        resetBook(initialData?.content || starter?.content || '', initialData?.letterPages);
        setRecipientName(initialData?.recipientName || '');
        setRecipientAddress(initialData?.recipientAddress || '');
        setCategory(initialData?.type || initialData?.category || starter?.category || 'Other');
        setFont(initialData?.font || 'font-serif');
        setIsAnonymous(initialData?.isAnonymous ?? preferences.defaultAnonymous);
        setIsPublic(initialData?.isPublic ?? preferences.defaultPublic);
        setBackgroundImage(initialData?.backgroundImage || papers[0].value);
        setImageUrl(initialData?.imageUrl || '');
        setSpotifyLink(initialData?.spotifyLink || '');
        setScheduledDate(localDateInput(initialData?.scheduledDate));
        setIsTimeCapsule(initialData?.isTimeCapsule || false);
        setOpenDate(localDateInput(initialData?.openDate));
        setSelectedTemplate(starter?.value || '');
        setLastSaved('');
        setNotice('');
        setIsDirty(false);
        setConfirming(false);
        setControlsOpen(false);
        setFocusMode(false);
        revision.current = 0;
    }, [isOpen, initialData, starterTemplate, preferences.defaultPublic, preferences.defaultAnonymous]);

    const payload = () => ({
        title: title.trim(),
        recipientName: recipientName.trim(),
        recipientAddress: recipientAddress.trim(),
        content: content.trim(),
        letterPages: pages,
        type: category,
        category,
        font,
        spotifyLink: spotifyLink.trim(),
        isAnonymous,
        isPublic,
        backgroundImage,
        imageUrl,
        scheduledDate: utcDate(scheduledDate),
        openDate: isTimeCapsule ? utcDate(openDate) : null,
        isTimeCapsule,
    });

    const canSave = title.trim().length > 0 && content.trim().length > 0;
    const canSaveDraft = Boolean(content.trim()) || pages.some(page => Boolean(page.imageData));

    const saveDraft = async (): Promise<boolean> => {
        if (editingPublished) { setNotice('Existing published letters are updated using the main action.'); return false; }
        if (!canSaveDraft) { setNotice('Start writing or import a photo before saving a draft.'); return false; }
        if (pendingSave.current) return pendingSave.current;
        const currentRevision = revision.current;
        const data = { ...payload(), title: title.trim() || 'Untitled letter' };
        const task = (async () => {
            setIsSaving(true);
            setNotice('');
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Please sign in to save your draft.');
                const id = draftIdRef.current;
                const response = await fetch(id ? `${API_ENDPOINTS.letters}/drafts/${encodeURIComponent(id)}` : API_ENDPOINTS.letters, {
                    method: id ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ ...data, status: 'draft' }),
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.message || 'Draft could not be saved.');
                if (!id && result.letter?.id) draftIdRef.current = String(result.letter.id);
                if (revision.current === currentRevision) setIsDirty(false);
                setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                await onDraftSaved?.();
                return true;
            } catch (error: any) {
                setNotice(error?.message || 'Could not save draft. Your words are still in the editor.');
                return false;
            } finally {
                setIsSaving(false);
            }
        })();
        pendingSave.current = task;
        try { return await task; } finally { if (pendingSave.current === task) pendingSave.current = null; }
    };

    useEffect(() => {
        if (!isOpen || editingPublished || !canSaveDraft || !isDirty || isSaving || publishing.current) return;
        const delay = pages.some(page => Boolean(page.imageData)) ? 900 : 10000;
        const timer = window.setTimeout(() => { if (!publishing.current) void saveDraft(); }, delay);
        return () => window.clearTimeout(timer);
    }, [isOpen, editingPublished, title, pages, recipientName, recipientAddress, category, font, isAnonymous, isPublic, backgroundImage, imageUrl, spotifyLink, scheduledDate, openDate, isTimeCapsule, isDirty, isSaving]);

    const closeEditor = () => {
        if (busy || isSaving) return;
        if (isDirty && canSaveDraft && !window.confirm('You have unsaved changes. Close without saving?')) return;
        onClose();
    };

    const saveAndClose = async () => {
        const saved = await saveDraft();
        if (saved) onClose();
    };

    const publish = async () => {
        if (publishing.current) return;
        if (!canSave) { setNotice('A title and letter content are required.'); return; }
        if (title.trim().length > 255 || content.length > 100000) { setNotice('Please shorten your title or letter.'); return; }
        if (isTimeCapsule && !openDate) { setNotice('Choose an opening date for your time capsule.'); setControlsOpen(true); return; }
        if ((scheduledDate && !utcDate(scheduledDate)) || (isTimeCapsule && !utcDate(openDate))) { setNotice('Choose a valid date and time.'); return; }
        const releaseDate = isTimeCapsule ? openDate : scheduledDate;
        const releaseWasChanged = !editingPublished ||
            isTimeCapsule !== Boolean(initialData?.isTimeCapsule) ||
            scheduledDate !== localDateInput(initialData?.scheduledDate) ||
            openDate !== localDateInput(initialData?.openDate);
        if (releaseDate && releaseWasChanged && new Date(releaseDate).getTime() <= Date.now()) {
            setNotice('Choose a future date and time for delivery.');
            setControlsOpen(true);
            return;
        }
        if (preferences.confirmBeforePublishing && !confirming) { setConfirming(true); setNotice(''); return; }
        publishing.current = true;
        setBusy(true);
        setNotice('');
        try {
            if (pendingSave.current) await pendingSave.current;
            const data = payload();
            const existingId = editingPublished ? String(initialData.id) : draftIdRef.current;
            let finalStatus = scheduled ? 'scheduled' : 'published';
            if (existingId) {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Please sign in again.');
                const url = editingPublished ? `${API_ENDPOINTS.letters}/${encodeURIComponent(existingId)}` : `${API_ENDPOINTS.letters}/drafts/${encodeURIComponent(existingId)}/publish`;
                const response = await fetch(url, {
                    method: editingPublished ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(data),
                });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.message || 'Could not finish your letter.');
                finalStatus = result.letter?.status || finalStatus;
            } else {
                await onSubmit({ ...data, status: 'published' });
            }
            await onPublished?.(finalStatus, isPublic);
            setIsDirty(false);
            onClose();
        } catch (error: any) {
            setNotice(error?.message || 'Unable to publish. Your letter is still here.');
            setConfirming(false);
        } finally {
            publishing.current = false;
            setBusy(false);
        }
    };

    const selectPrompt = (value: string) => {
        const template = templates.find(t => t.value === value);
        if (!template) return;
        if ((title.trim() || content.trim()) && !window.confirm('Replace the current title and message with this starting point?')) return;
        setSelectedTemplate(value);
        setTitle(template.title);
        resetBook(template.content);
        setCategory(template.category);
        markDirty();
    };

    const imageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
            setNotice('Choose a JPG, PNG or WebP image under 5 MB.');
            event.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const data = String(reader.result || '');
            if (data.length > 7500000) { setNotice('The image is too large after encoding.'); return; }
            setImageUrl(data);
            setNotice('');
            markDirty();
        };
        reader.onerror = () => setNotice('Could not read this image. Try another one.');
        reader.readAsDataURL(file);
    };

    const page = pages[Math.min(pageIndex, pages.length - 1)];
    const paper = papers.find(p => p.value === backgroundImage) || papers[0];
    const photoControls = page.imageData ? <section aria-label="Photo layout controls" className="mt-3 rounded-2xl border border-[#d9caba] bg-[#fffbf6] p-3 text-[#39483c]">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold">Photo in this letter</p>
            <label className="flex items-center gap-2 text-xs font-semibold">Layout
                <select aria-label="Photo position" value={page.imagePlacement || 'after'}
                    onChange={event => {
                        updateImageLayout({ imagePlacement: event.target.value as 'left' | 'right' | 'before' | 'after',
                            ...(event.target.value === 'left' || event.target.value === 'right'
                                ? { imageAnchor: page.imageAnchor ?? caretAnchor.current, imageWidth: Math.min(page.imageWidth ?? 42, 65) } : {}) });
                        markDirty();
                    }}
                    className="min-h-10 rounded-lg border border-[#c7b9a7] bg-white px-3 py-2">
                    <option value="right">Wrap text · photo right</option>
                    <option value="left">Wrap text · photo left</option>
                    <option value="before">Above the words</option>
                    <option value="after">Below the words</option>
                </select>
            </label>
        </div>
        <p className="mt-2 text-[11px] text-[#806e5d]">Move your photo within the letter. The page expands to keep the image inside its borders.</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Move photo within letter">
            {([
                { label: 'Top', anchor: 0 },
                { label: 'Middle', anchor: Math.max(0, Math.floor(page.text.length / 2)) },
                { label: 'End', anchor: page.text.length },
            ] as const).map(position => <button type="button" key={position.label}
                onClick={() => {
                    updateImageLayout({
                        imagePlacement: page.imagePlacement === 'left' ? 'left' : 'right',
                        imageAnchor: position.anchor,
                        imageWidth: Math.min(page.imageWidth ?? 42, 65),
                    });
                    markDirty();
                    window.requestAnimationFrame(() => document.querySelector('[data-editable-letter-photo]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
                }}
                className="min-h-9 rounded-full border border-[#c7b9a7] bg-white px-3 text-xs font-semibold text-[#33483c] hover:bg-[#f4eadc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33483c]">
                {position.label}
            </button>)}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => {
                updateImageLayout({ imageAnchor: caretAnchor.current, imagePlacement: page.imagePlacement === 'left' ? 'left' : 'right',
                    imageWidth: Math.min(page.imageWidth ?? 42, 65) });
                markDirty();
                window.requestAnimationFrame(() => document.querySelector('[data-editable-letter-photo]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
            }} className="min-h-10 rounded-full border border-[#c7b9a7] bg-white px-3 text-xs font-semibold hover:bg-[#f4eadc]">Place photo at cursor</button>
            <label className="flex min-w-[160px] flex-1 items-center gap-3 text-xs font-semibold">
                Photo width
                <input type="range" min="30" max={page.imagePlacement === 'left' || page.imagePlacement === 'right' ? 65 : 90}
                    step="5" aria-label="Photo width as percentage of page"
                    value={Math.min(page.imageWidth ?? 42, page.imagePlacement === 'left' || page.imagePlacement === 'right' ? 65 : 90)}
                    onChange={event => { updateImageLayout({ imageWidth: Number(event.target.value) }); markDirty(); }}
                    className="min-w-0 flex-1 accent-[#344a3c]" />
                <output>{Math.min(page.imageWidth ?? 42, page.imagePlacement === 'left' || page.imagePlacement === 'right' ? 65 : 90)}%</output>
            </label>
        </div>
        <label htmlFor="letter-image-caption" className="sr-only">Caption for this photo</label>
        <input id="letter-image-caption" maxLength={140} value={page.caption || ''}
            onChange={event => { setCaption(event.target.value); markDirty(); }} placeholder="Optional photo caption…"
            className="mt-3 h-9 w-full border-b border-[#c7b9a7] bg-transparent text-center font-serif text-sm italic outline-none" />
        <button type="button" onClick={() => { removeImage(); markDirty(); }} className="mt-2 text-xs font-semibold text-[#785c4f] underline">Remove photo</button>
    </section> : null;

    const scheduled = Boolean((isTimeCapsule ? openDate : scheduledDate) &&
        (utcDate(isTimeCapsule ? openDate : scheduledDate) || '') > new Date().toISOString());
    const actionLabel = editingPublished ? 'Save changes' : scheduled ? 'Schedule letter' : isPublic ? 'Publish letter' : 'Finish private letter';
    const earliestLocalDate = localDateInput(new Date(Date.now() + 60_000));
    const timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const labelClass = 'block text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground';
    const fieldClass = 'mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10';
    const panelClass = 'rounded-[20px] border border-border bg-card p-4';

    return <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <DialogContent className="flex h-[min(96dvh,950px)] w-[calc(100vw-8px)] min-w-0 max-w-[1220px] flex-col gap-0 overflow-hidden rounded-[16px] border border-border bg-card p-0 shadow-[0_30px_90px_rgba(0,0,0,.3)] sm:w-[calc(100vw-40px)] sm:rounded-[30px]">
            <DialogTitle className="sr-only">{editingPublished ? 'Edit your letter' : 'Write a letter'}</DialogTitle>
            <DialogDescription className="sr-only">Write a thoughtful letter, customize the paper, save as draft or finish publishing.</DialogDescription>

            <header className="relative flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-4 pr-14 sm:px-7 sm:pr-16">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--surface-gold))] text-[#564932]"><CharacterBadge name="lumi" tone="gold" size="md" /></div>
                    <div><p className="text-[10px] font-bold uppercase tracking-[.19em] text-[hsl(var(--accent))]">Your writing desk</p><h2 className="font-editorial text-xl font-semibold sm:text-2xl">{editingPublished ? 'Edit your letter' : 'A letter starts here'}</h2></div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="hidden rounded-full bg-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground sm:inline-flex"><CharacterBadge name="susi" tone="paper" size="xs" className="mr-1" /> {isPublic ? 'Public' : 'Private'} letter</span>
                    <button type="button" onClick={() => { setFocusMode(value => !value); setControlsOpen(false); }} aria-pressed={focusMode} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-muted">
                        <CharacterBadge name={focusMode ? 'susi' : 'basa'} tone="paper" size="xs" />
                        {focusMode ? 'Exit focus' : 'Focus mode'}
                    </button>
                    {!focusMode && <button type="button" onClick={() => setControlsOpen(value => !value)} aria-expanded={controlsOpen} aria-controls="letter-customization" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-muted lg:hidden"><CharacterBadge name="tala" tone="paper" size="xs" /> Customize</button>}
                </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                <aside id="letter-customization" className={cn('shrink-0 overflow-y-auto border-b border-border bg-muted/30 px-4 py-5 sm:px-6 lg:w-[318px] lg:border-b-0 lg:border-r', focusMode ? 'hidden' : controlsOpen ? 'max-h-[44dvh] lg:max-h-none' : 'hidden lg:block')} aria-label="Letter customization">
                    <div className="mb-5 hidden lg:block"><p className="font-editorial text-xl">Make it yours</p><p className="mt-1 text-xs leading-5 text-muted-foreground">A few thoughtful details, only if you want them.</p></div>
                    <div className="space-y-4 pb-3">
                        <section aria-label="Add images to letter" className={panelClass}>
                            <p className={labelClass}><CharacterBadge name="basa" tone="paper" size="xs" className="mr-2 inline-flex" /> Photos & memories</p>
                            <label htmlFor="letter-page-image" className="mt-3 flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-[#bba98f] bg-[#fffbf5] px-3 py-3 text-center hover:border-[#304c40] hover:bg-white">
                                <CharacterBadge name="piko" tone="paper" size="sm" />
                                <span className="text-sm font-semibold text-[#304c40]">Insert image</span>
                                <span className="text-[11px] text-[#806f61]">Automatically place a photo in your letter</span>
                            </label>
                            <input id="letter-page-image" aria-label="Insert image in page" type="file" className="sr-only" accept="image/png,image/jpeg,image/webp"
                                onChange={async event => {
                                    const file = event.currentTarget.files?.[0];
                                    event.currentTarget.value = '';
                                    if (!file) return;
                                    try {
                                        await addPhoto(file, caretAnchor.current);
                                        markDirty();
                                        setNotice('Photo inserted. Auto-saving to My Library drafts…');
                                    } catch (error: any) { setBookError(error?.message || 'Could not insert this photo.'); }
                                }} />
                            <p className="mt-2 text-[11px] leading-5 text-[#806f61]">JPG, PNG or WebP · up to 7 MB. Imported photos and layout save with your draft.</p>
                            {page.imageData && <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#e4d8c8] bg-white p-2">
                                <img src={page.imageData} alt="Current page photo preview" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                                <div className="min-w-0"><p className="text-xs font-semibold">Photo on page {pageIndex + 1}</p><p className="text-[11px] text-muted-foreground">Adjust placement below</p></div>
                            </div>}
                            {photoControls}
                        </section>
                        <div className={panelClass}>
                            <label className={labelClass} htmlFor="letter-starting-point"><CharacterBadge name="tala" tone="gold" size="xs" className="mr-1 inline-flex" /> Need inspiration?</label>
                            <select id="letter-starting-point" value={selectedTemplate} onChange={e => selectPrompt(e.target.value)} className={fieldClass}><option value="">Choose a starting point</option>{templates.map(t => <option key={t.value} value={t.value}>{t.name}</option>)}</select>
                            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Templates are optional. Your words are what matter.</p>
                        </div>
                        <div className={panelClass}>
                            <p className={labelClass}><CharacterBadge name="tala" tone="paper" size="xs" className="mr-2 inline-flex" /> Personalize</p>
                            <label className="mt-4 block text-xs font-semibold" htmlFor="letter-font">Writing style</label>
                            <select id="letter-font" value={font} onChange={e => { setFont(e.target.value); markDirty(); }} className={fieldClass}>{fonts.map(t => <option key={t.value} value={t.value}>{t.name}</option>)}</select>
                            <label className="mt-4 block text-xs font-semibold" htmlFor="letter-category">Category</label>
                            <select id="letter-category" value={category} onChange={e => { setCategory(e.target.value); markDirty(); }} className={fieldClass}>{categories.map(c => <option key={c}>{c}</option>)}</select>
                            <p className="mt-4 text-xs font-semibold">Paper color</p>
                            <div className="mt-2 grid grid-cols-6 gap-2">{papers.map(p => <button type="button" key={p.name} title={p.name} aria-label={`Use ${p.name} paper`} aria-pressed={backgroundImage === p.value} onClick={() => { setBackgroundImage(p.value); markDirty(); }} className={cn('relative h-9 min-w-0 rounded-xl border-2 transition-transform hover:scale-105', p.className, backgroundImage === p.value ? 'border-primary ring-2 ring-primary/20' : 'border-border')}>{backgroundImage === p.value && <span className="sr-only">Selected</span>}</button>)}</div>
                        </div>
                        <div className={panelClass}>
                            <p className={labelClass}><CharacterBadge name="susi" tone="sage" size="xs" className="mr-1 inline-flex" /> Visibility</p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => { setIsPublic(false); markDirty(); }} aria-pressed={!isPublic} className={cn('flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold', !isPublic ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground')}><CharacterBadge name="susi" tone="paper" size="xs" /> Private</button>
                                <button type="button" onClick={() => { setIsPublic(true); markDirty(); }} aria-pressed={isPublic} className={cn('flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold', isPublic ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground')}><CharacterBadge name="piko" tone="paper" size="xs" /> Public</button>
                            </div>
                            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{isPublic ? 'Public letters can be discovered and shared. Guests can react after publishing.' : 'Private letters stay out of the public feed. You decide when to share.'}</p>
                            <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-background px-3 py-3 text-xs font-semibold"><span className="inline-flex items-center gap-2"><CharacterBadge name="susi" tone="paper" size="xs" /> Post anonymously</span><input type="checkbox" checked={isAnonymous} onChange={e => { setIsAnonymous(e.target.checked); markDirty(); }} className="h-4 w-4 accent-[#344d40]" /></label>
                        </div>
                        <details className={panelClass}>
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-bold uppercase tracking-[.14em]"><span className="inline-flex items-center gap-2"><CharacterBadge name="piko" tone="paper" size="xs" /> Attachments</span></summary>
                            <div className="mt-4 space-y-3">
                                <label className="block text-xs font-semibold" htmlFor="letter-spotify">Music link (Spotify or YouTube)</label>
                                <input id="letter-spotify" type="url" value={spotifyLink} onChange={e => { setSpotifyLink(e.target.value); markDirty(); }}
                                    placeholder="Paste a Spotify or YouTube link" aria-describedby="letter-spotify-help"
                                    aria-invalid={Boolean(spotifyLink.trim() && !parseLetterMusicLink(spotifyLink))}
                                    className={fieldClass} />
                                <p id="letter-spotify-help" className={`text-[11px] leading-5 ${spotifyLink.trim() && !parseLetterMusicLink(spotifyLink) ? 'text-rose-700' : 'text-muted-foreground'}`}>
                                    {spotifyLink.trim() && !parseLetterMusicLink(spotifyLink)
                                        ? 'Paste a valid official Spotify or YouTube watch link.'
                                        : 'Spotify plays in the letter with audio controls. YouTube links open on YouTube; hidden audio-only playback is unavailable.'}
                                </p>
                                <label htmlFor="letter-image" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background p-3 text-xs font-semibold hover:border-primary"><CharacterBadge name="basa" tone="paper" size="xs" /> {imageUrl ? 'Change cover image' : 'Add cover image'}<input id="letter-image" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={imageUpload} /></label>
                                {imageUrl && <button type="button" onClick={() => { setImageUrl(''); markDirty(); }} className="text-xs font-semibold text-muted-foreground underline">Remove image</button>}
                            </div>
                        </details>
                        <details className={panelClass}>
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-bold uppercase tracking-[.14em]"><span className="inline-flex items-center gap-2"><CharacterBadge name="araw" tone="gold" size="sm" /> Deliver later</span></summary>
                            <div className="mt-4 space-y-3">
                                <label className="block text-xs font-semibold" htmlFor="letter-schedule">Schedule release</label>
                                <p className="text-[11px] text-muted-foreground">Your time zone: {timeZoneName}. Choose a future local date and time.</p>
                                <input id="letter-schedule" type="datetime-local" min={earliestLocalDate} value={scheduledDate} disabled={isTimeCapsule} onChange={e => { setScheduledDate(e.target.value); markDirty(); }} className={fieldClass} />
                                <label className="flex items-center justify-between gap-2 text-xs font-semibold"><span>Time capsule</span><input type="checkbox" checked={isTimeCapsule} onChange={e => { setIsTimeCapsule(e.target.checked); markDirty(); }} className="h-4 w-4 accent-[#344d40]" /></label>
                                {isTimeCapsule && <><p className="text-[11px] text-muted-foreground">The letter stays sealed until the date you choose.</p><label className="block text-xs font-semibold" htmlFor="letter-open-date">Open date</label><input id="letter-open-date" type="datetime-local" min={earliestLocalDate} value={openDate} onChange={e => { setOpenDate(e.target.value); markDirty(); }} className={fieldClass} /></>}
                                <label className="block text-xs font-semibold" htmlFor="letter-address">Recipient's address (optional)</label>
                                <input id="letter-address" value={recipientAddress} maxLength={255} onChange={e => { setRecipientAddress(e.target.value); markDirty(); }} placeholder="For your own reference" className={fieldClass} />
                                <p className="text-[11px] leading-5 text-muted-foreground">Finishing a letter saves it to SendTheLetter. Email delivery is a separate sharing action.</p>
                            </div>
                        </details>
                    </div>
                </aside>

                <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[hsl(var(--background))] p-3 sm:p-5 lg:p-7">
                    <div className={cn('relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[19px] border border-[#e9dfd1] shadow-[0_12px_40px_rgba(64,48,31,.09)] sm:rounded-[24px]', paper.className)} >
                        <div className={cn('relative flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-7 sm:px-10 sm:py-9 lg:px-12', 'text-[#35483d]')}
                            onDragOver={event => { if (Array.from(event.dataTransfer.types).includes('Files')) event.preventDefault(); }}
                            onDrop={event => {
                                const file = Array.from(event.dataTransfer.files).find(item => item.type.startsWith('image/'));
                                if (!file) return;
                                event.preventDefault();
                                void addPhoto(file, caretAnchor.current).then(() => { markDirty(); setNotice('Photo inserted in the page. Choose left/right wrap or move it to another paragraph.'); })
                                    .catch(error => setBookError(error instanceof Error ? error.message : 'Could not add photo.'));
                            }}>
                            <div className={cn('mb-7 flex items-center justify-between gap-2 border-b pb-4 text-[10px] font-bold uppercase tracking-[.20em]', 'border-[#dcd6c8] text-[#9a796b]')}>
                                <span className="inline-flex items-center gap-2"><CharacterBadge name="lumi" tone="rose" size="xs" /> A letter from the heart</span>
                                <span className="hidden sm:inline">{category}</span>
                            </div>
                            {pageIndex === 0 ? <>
                            <label className="sr-only" htmlFor="letter-title">Letter title</label>
                            <input id="letter-title" maxLength={255} value={title} onChange={e => { setTitle(e.target.value); markDirty(); }} placeholder="Give your letter a title…" className={cn('w-full border-none bg-transparent p-0 font-editorial text-[clamp(1.55rem,3.5vw,2.6rem)] font-semibold leading-tight tracking-tight outline-none placeholder:opacity-40', 'text-[#35483d] placeholder:text-[#988d83]')} />
                            <div className={cn('mt-6 flex items-center border-b pb-3', 'border-[#dcd6c8]')}>
                                <span className={cn('shrink-0 font-serif text-lg italic', 'text-[#7d786c]')}>Dear</span>
                                <label className="sr-only" htmlFor="letter-recipient">Recipient</label>
                                <input id="letter-recipient" maxLength={255} value={recipientName} onChange={e => { setRecipientName(e.target.value); markDirty(); }} placeholder="someone special…" className={cn('ml-2 min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:opacity-40', 'text-[#35483d] placeholder:text-[#9c958c]')} />
                                <span className="font-serif text-lg">,</span>
                            </div>
                            </> : <div className={cn('mb-7 border-b pb-4', 'border-[#dcd6c8] text-[#756b60]')}>
                                <p className="font-editorial text-xl leading-snug">{title || 'Untitled letter'}</p>
                                <p className="mt-2 text-xs font-semibold italic">…continued on page {pageIndex + 1}</p>
                            </div>}
                            <div className={cn('mb-1 flex flex-wrap items-center justify-between gap-2', 'text-[#8b7361]')}>
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.16em]"><CharacterBadge name="basa" tone="gold" size="xs" /> Page {pageIndex + 1} of {pages.length}</span>
                                <span className="text-[11px] italic text-[#8b7361]">Insert images from Make it yours</span>
                            </div>
                            {page.imageData
                                ? <LetterFlowEditor key={pageIndex} page={page} font={font}
                                    onChange={(text, anchor) => { if (updateComposedText(text, anchor)) markDirty(); }}
                                    onCursor={anchor => { caretAnchor.current = anchor; }}
                                    onMovePhoto={anchor => { updateImageLayout({ imageAnchor: anchor, imagePlacement: page.imagePlacement === 'left' ? 'left' : 'right', imageWidth: Math.min(page.imageWidth ?? 42, 65) }); markDirty(); }}
                                    onPhotoFile={(file, anchor) => {
                                        void addPhoto(file, anchor).then(() => { markDirty(); setNotice('Photo inserted on the next page.'); })
                                            .catch(error => setBookError(error instanceof Error ? error.message : 'Could not add photo.'));
                                    }}
                                    onError={setBookError}
                                />
                                : <><label className="sr-only" htmlFor="letter-content">Your letter</label>
                                    <textarea id="letter-content" value={page.text}
                                        onSelect={event => { caretAnchor.current = event.currentTarget.selectionStart; }}
                                        onClick={event => { caretAnchor.current = event.currentTarget.selectionStart; }}
                                        onChange={event => { caretAnchor.current = event.currentTarget.selectionStart; if (updateText(event.target.value)) markDirty(); }}
                                        onPaste={event => {
                                            const image = Array.from(event.clipboardData.items).find(item => item.kind === 'file' && item.type.startsWith('image/'));
                                            if (image) {
                                                event.preventDefault();
                                                const file = image.getAsFile();
                                                if (file) void addPhoto(file, event.currentTarget.selectionStart).then(markDirty).catch(error => setBookError(error instanceof Error ? error.message : 'Could not paste image.'));
                                                return;
                                            }
                                            const text = event.clipboardData.getData('text/plain');
                                            if (/data:image\/(?:png|jpeg|webp);base64,/i.test(text) || /[A-Za-z0-9+/]{256,}={0,2}/.test(text)) {
                                                event.preventDefault();
                                                setBookError('Insert photos with the image button, not encoded data.');
                                            }
                                        }}
                                        placeholder={"Tell them what you've been meaning to say…\n\nStart with a memory, a feeling, or just a simple hello."}
                                        className={cn('mt-7 min-h-[280px] w-full flex-1 resize-none border-0 bg-transparent p-0 text-base leading-[1.9] outline-none placeholder:opacity-50 sm:text-lg', font, 'text-[#35483d] placeholder:text-[#8b9188]')} /></>}
                            <div className={cn('mt-8 flex justify-end gap-2 border-t pt-5 font-serif italic', 'border-[#dcd6c8] text-[#817e72]')}><span>With care,</span><span className="font-semibold">{isAnonymous ? 'Anonymous' : (user?.username?.includes('@') ? user.username.split('@')[0] : user?.username) || 'Me'}</span></div>
                        </div>
                    </div>
                    <nav aria-label="Book page controls" className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/80 p-2">
                        <button type="button" disabled={pageIndex === 0} onClick={() => setPageIndex(Math.max(0, pageIndex - 1))} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-35">Previous</button>
                        <div className="flex items-center gap-2">
                            <span className="hidden text-[11px] font-semibold text-muted-foreground sm:inline">{pageIndex + 1} / {pages.length}</span>
                            <button type="button" onClick={() => { if (addPage()) markDirty(); }} disabled={pages.length >= 80} className="rounded-full border border-border bg-background px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-35">+ Add page</button>
                            {pages.length > 1 && !page.text && !page.imageData && <button type="button" onClick={() => { if (removeBlank()) markDirty(); }} className="rounded-full border border-border bg-background p-2 text-muted-foreground hover:text-red-700" title="Remove blank page" aria-label="Remove blank page">Remove</button>}
                        </div>
                        <button type="button" disabled={pageIndex >= pages.length - 1} onClick={() => setPageIndex(Math.min(pages.length - 1, pageIndex + 1))} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-35">Next</button>
                    </nav>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><CharacterBadge name="lumi" tone="paper" size="xs" /> {wordCount} {wordCount === 1 ? 'word' : 'words'} written</span><span role="status" aria-live="polite" className="inline-flex items-center gap-1.5">{isSaving ? 'Saving draft…' : isDirty ? pages.some(p => p.imageData) && !editingPublished ? 'Unsaved changes · photos autosave shortly' : 'Unsaved changes · autosave after 10 seconds' : lastSaved ? 'Saved at ' + lastSaved : 'Every word matters'}</span></div>
                </div>
            </div>

            {bookError && <div role="alert" className="mx-5 mt-2 rounded-xl bg-red-50 px-4 py-2 text-xs text-red-800">{bookError}</div>}
            {notice && <div role="alert" className="mx-5 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900 sm:mx-7">{notice}</div>}
            {confirming && <div className="mx-5 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/80 px-4 py-3 sm:mx-7">
                <div className="min-w-0"><p className="flex items-center gap-2 text-sm font-bold"><CharacterBadge name="sely" tone="sage" size="sm" /> Ready to finish this letter?</p><p className="mt-1 text-xs text-muted-foreground">{isPublic ? 'Public: other people can read and share it.' : 'Private: only you can access it.'} {scheduled ? 'It will be released at your selected date.' : 'It will be saved immediately.'}</p></div>
                <div className="flex items-center gap-2"><button type="button" onClick={() => setConfirming(false)} className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold">Review again</button><button type="button" disabled={busy} onClick={() => void publish()} className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Yes, continue</button></div>
            </div>}

            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-4 py-3 sm:px-7 sm:py-4">
                <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><CharacterBadge name={isPublic ? 'piko' : 'susi'} tone="paper" size="xs" /><span>{isPublic ? 'Visible to the community when released' : 'Just for you, unless you share it'}</span></div>
                <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
                    <button type="button" onClick={() => void saveAndClose()} disabled={busy || isSaving || editingPublished || !canSaveDraft} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-bold hover:bg-muted disabled:opacity-40 sm:flex-none sm:px-5"><CharacterBadge name="basa" tone="paper" size="xs" /> Save draft</button>
                    <button type="button" onClick={() => void publish()} disabled={busy || isSaving || !canSave} className="inline-flex h-11 flex-[1.3] items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5 disabled:opacity-40 sm:flex-none sm:px-6">{busy ? 'Working…' : actionLabel} <CharacterBadge name="piko" tone="paper" size="xs" /></button>
                </div>
            </footer>
        </DialogContent>
    </Dialog>;
};

export default LetterEditorModal;
