export interface Comment {
    id: string | number;
    letterId: string | number;
    userId: string | number;
    userName: string;
    content: string;
    createdAt: Date | string;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    category?: string;
    type?: string; // Added to match backend
    isPublic: boolean;
    authorId: string | number; // Backend uses number
    authorName?: string; // Added for frontend display
    createdAt: Date | string; // Backend returns string
    reactions: Record<string, number>;
    spotifyLink?: string;
    font?: string;
    recipientName?: string;
    recipientAddress?: string;
    isAnonymous?: boolean;
    backgroundImage?: string;
    likeCount?: number;
    commentCount?: number;
    isLikedByUser?: boolean;
    comments?: Comment[];
    imageUrl?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    scheduledDate?: Date | string;
    openDate?: Date | string;
    isTimeCapsule?: boolean;
    status?: string;
    repostCount?: number;
    isReposted?: boolean;
}
