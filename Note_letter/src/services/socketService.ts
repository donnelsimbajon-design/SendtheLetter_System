import { io, Socket } from 'socket.io-client';
import API_BASE_URL from '../config/api';

class SocketService {
    private socket: Socket | null = null;
    private activeUserId: number | null = null;

    connect(userId: number) {
        // Reuse an existing connection (including one still handshaking).
        if (this.socket && this.activeUserId === userId) return;

        this.disconnect();
        this.activeUserId = userId;
        const socket = io(API_BASE_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            auth: { token: localStorage.getItem('token') },
        });
        this.socket = socket;

    }

    disconnect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
        this.activeUserId = null;
    }

    joinLetterRoom(letterId: string) {
        if (this.socket?.connected) this.socket.emit('join_letter', letterId);
    }

    leaveLetterRoom(letterId: string) {
        if (this.socket?.connected) this.socket.emit('leave_letter', letterId);
    }

    onNewComment(callback: (comment: any) => void) { this.socket?.on('new_comment', callback); }
    onLikeUpdate(callback: (data: { letterId: string; likeCount: number; liked: boolean }) => void) { this.socket?.on('like_update', callback); }
    onNewNotification(callback: (notification: any) => void) { this.socket?.on('new_notification', callback); }
    onNewMessage(callback: (message: any) => void) { this.socket?.on('new_message', callback); }

    offNewMessage() { this.socket?.off('new_message'); }
    offNewComment() { this.socket?.off('new_comment'); }
    offLikeUpdate() { this.socket?.off('like_update'); }
    offNewNotification() { this.socket?.off('new_notification'); }

    getSocket() { return this.socket; }
}

export default new SocketService();
