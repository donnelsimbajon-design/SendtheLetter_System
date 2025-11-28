export interface Note {
    id: string;
    title: string;
    content: string;
    category: string;
    isPublic: boolean;
    authorId: string;
    createdAt: Date;
    reactions: Record<string, number>;
    spotifyLink?: string;
    font?: string;
    recipientName?: string;
    recipientAddress?: string;
    isAnonymous?: boolean;
}
