
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Archive, Trash2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onArchive: () => Promise<void> | void;
    onDelete: () => Promise<void> | void;
    title?: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    isOpen,
    onClose,
    onArchive,
    onDelete,
    title = 'Delete Letter'
}) => {
    const [busy, setBusy] = useState<'archive' | 'delete' | null>(null);
    const [error, setError] = useState('');
    const perform = async (action: 'archive' | 'delete') => {
        if (busy) return;
        setBusy(action);
        setError('');
        try {
            if (action === 'archive') await onArchive(); else await onDelete();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'The action failed. Please try again.');
        } finally {
            setBusy(null);
        }
    };
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
            <DialogContent className="sm:max-w-[425px]" onClick={event => event.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        What would you like to do with this letter?
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-stone-500">
                        You can <span className="font-bold text-stone-700">Archive</span> it to hide it from your profile but keep it for later, or <span className="font-bold text-red-500">Delete Permanently</span> to remove it forever.
                    </p>
                </div>
                {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} disabled={busy !== null} className="sm:mr-auto">
                        Cancel
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => { void perform('archive'); }}
                        disabled={busy !== null}
                        className="flex items-center gap-2"
                    >
                        <Archive size={16} />
                        {busy === 'archive' ? 'Archiving…' : 'Archive'}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => { void perform('delete'); }}
                        disabled={busy !== null}
                        className="flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        {busy === 'delete' ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteConfirmDialog;
