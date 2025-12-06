
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Archive, Trash2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onArchive: () => void;
    onDelete: () => void;
    title?: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    isOpen,
    onClose,
    onArchive,
    onDelete,
    title = 'Delete Letter'
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
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
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose} className="sm:mr-auto">
                        Cancel
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            onArchive();
                            onClose();
                        }}
                        className="flex items-center gap-2"
                    >
                        <Archive size={16} />
                        Archive
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onDelete();
                            onClose();
                        }}
                        className="flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteConfirmDialog;
