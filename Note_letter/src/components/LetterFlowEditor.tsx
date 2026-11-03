import { useLayoutEffect, useRef } from 'react';
import type { ClipboardEvent, DragEvent } from 'react';
import type { StoryPage } from '../types/note';
import { clampImageAnchor, photoLayoutStyle } from '../lib/letterImageLayout';

type Props = {
    page: StoryPage;
    font: string;
    onChange: (text: string, anchor: number) => void;
    onCursor: (anchor: number) => void;
    onMovePhoto: (anchor: number) => void;
    onPhotoFile: (file: File, anchor: number) => void;
    onError: (message: string) => void;
};

/** Text is edited exactly once, with a non-editable floated image at its saved
 * character anchor. The editor's DOM is not replaced on each keystroke.
 */
export default function LetterFlowEditor({ page, font, onChange, onCursor, onMovePhoto, onPhotoFile, onError }: Props) {
    const editorRef = useRef<HTMLDivElement>(null);
    const sourceRef = useRef<string | null>(null);

    const selectionOffset = (): number => {
        const root = editorRef.current;
        const selection = window.getSelection();
        if (!root || !selection?.rangeCount) return clampImageAnchor(page);
        const range = selection.getRangeAt(0);
        if (!root.contains(range.startContainer)) return clampImageAnchor(page);
        const prefix = document.createRange();
        prefix.selectNodeContents(root);
        prefix.setEnd(range.startContainer, range.startOffset);
        return Math.max(0, Math.min(root.innerText.length, prefix.toString().length));
    };

    const photoOffset = (root: HTMLDivElement): number => {
        const figure = root.querySelector('[data-editable-letter-photo]');
        if (!figure) return 0;
        const range = document.createRange();
        range.selectNodeContents(root);
        range.setEndBefore(figure);
        return range.toString().length;
    };

    useLayoutEffect(() => {
        const root = editorRef.current;
        if (!root) return;
        const currentFigure = root.querySelector<HTMLElement>('[data-editable-letter-photo]');
        const hasCorrectImage = !!currentFigure && !!page.imageData &&
            currentFigure.querySelector('img')?.getAttribute('src') === page.imageData;
        const matchingText = sourceRef.current === page.text && root.innerText.replace(/\r/g, '') === page.text;
        const matchingAnchor = !page.imageData || photoOffset(root) === clampImageAnchor(page);

        if (!matchingText || !hasCorrectImage || !matchingAnchor) {
            // Keep the image out of contenteditable text, so there can never be
            // an accidentally duplicated image caption or the same prose twice.
            root.replaceChildren();
            const anchor = clampImageAnchor(page);
            root.appendChild(document.createTextNode(page.text.slice(0, anchor)));
            if (page.imageData) {
                const figure = document.createElement('figure');
                figure.setAttribute('data-editable-letter-photo', '');
                figure.contentEditable = 'false';
                figure.draggable = true;
                figure.title = 'Drag this photo to another place in the letter';
                figure.setAttribute('aria-label', 'Letter photo, draggable to another text position');
                figure.className = 'box-border max-w-full cursor-grab rounded-lg border border-[#d9cbbb] bg-[#fff9ef] p-1.5 shadow-sm';
                Object.assign(figure.style, photoLayoutStyle(page));
                const img = document.createElement('img');
                img.src = page.imageData;
                img.alt = page.caption || 'Photo in the letter';
                img.draggable = false;
                img.className = 'block h-auto max-h-[270px] w-full rounded-md object-contain';
                figure.appendChild(img);
                figure.ondragstart = event => {
                    event.dataTransfer?.setData('application/x-sendtheletter-photo', 'move');
                    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
                };
                root.appendChild(figure);
            }
            root.appendChild(document.createTextNode(page.text.slice(anchor)));
            sourceRef.current = page.text;
        } else if (currentFigure) {
            Object.assign(currentFigure.style, photoLayoutStyle(page));
        }
    }, [page.text, page.imageData, page.imageAnchor, page.imagePlacement, page.imageWidth, page.caption]);

    const updateText = () => {
        const root = editorRef.current;
        if (!root) return;
        const text = root.innerText.replace(/\r/g, '');
        const anchor = Math.min(text.length, photoOffset(root));
        sourceRef.current = text;
        onCursor(selectionOffset());
        onChange(text, anchor);
    };

    const dropAnchor = (event: DragEvent<HTMLDivElement>): number => {
        const x = event.clientX, y = event.clientY;
        const doc = document as Document & {
            caretRangeFromPoint?: (x: number, y: number) => Range | null;
            caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
        };
        const range = doc.caretRangeFromPoint?.(x, y) ?? null;
        const position = !range ? doc.caretPositionFromPoint?.(x, y) : null;
        const root = editorRef.current;
        if (!root) return 0;
        const prefix = document.createRange();
        prefix.selectNodeContents(root);
        if (range && root.contains(range.startContainer)) prefix.setEnd(range.startContainer, range.startOffset);
        else if (position && root.contains(position.offsetNode)) prefix.setEnd(position.offsetNode, position.offset);
        else return selectionOffset();
        return Math.min(root.innerText.length, prefix.toString().length);
    };

    const paste = (event: ClipboardEvent<HTMLDivElement>) => {
        const image = Array.from(event.clipboardData.items).find(item => item.kind === 'file' && item.type.startsWith('image/'));
        if (image) {
            event.preventDefault();
            const file = image.getAsFile();
            if (file) onPhotoFile(file, selectionOffset());
            return;
        }
        const plain = event.clipboardData.getData('text/plain');
        if (/data:image\/(?:png|jpeg|webp);base64,/i.test(plain) || /[A-Za-z0-9+/]{256,}={0,2}/.test(plain)) {
            event.preventDefault();
            onError('Use Insert image in page to add photos, rather than pasting encoded data.');
            return;
        }
        // Paste plain text only; no arbitrary HTML or scripts in letter content.
        event.preventDefault();
        document.execCommand('insertText', false, plain);
    };

    return <div
        ref={editorRef}
        role="textbox"
        aria-label="Your letter"
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        spellCheck
        onInput={updateText}
        onClick={() => onCursor(selectionOffset())}
        onKeyUp={() => onCursor(selectionOffset())}
        onPaste={paste}
        onDragOver={event => {
            if (Array.from(event.dataTransfer.types).some(type => type === 'Files' || type === 'application/x-sendtheletter-photo')) event.preventDefault();
        }}
        onDrop={event => {
            const file = Array.from(event.dataTransfer.files).find(item => item.type.startsWith('image/'));
            const moving = Array.from(event.dataTransfer.types).includes('application/x-sendtheletter-photo');
            if (!file && !moving) return;
            event.preventDefault();
            event.stopPropagation(); // outer editor must not upload the same file twice
            const anchor = dropAnchor(event);
            if (moving) onMovePhoto(anchor);
            else onPhotoFile(file!, anchor);
        }}
        className={`mt-5 min-h-[280px] w-full min-w-0 flex-1 break-words whitespace-pre-wrap text-base leading-[1.9] outline-none sm:text-lg ${font}`}
        data-testid="letter-flow-editor"
    />;
}
