import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Constructs the full URL for images stored on the backend server
 * @param path - The relative path (e.g., "/uploads/image.jpg")
 * @returns Full URL to the image
 */
export function getImageUrl(path: string | null | undefined): string {
    if (!path) return '';

    // If already a full URL, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Construct full URL with backend server
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiUrl}${path}`;
}
