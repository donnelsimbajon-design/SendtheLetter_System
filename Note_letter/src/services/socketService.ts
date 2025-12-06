import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;

    connect(userId: number) {
        if (this.socket?.connected) {
            return;
        }

        this.socket = io('http://localhost:5000', {
            transports: ['websocket'],
            autoConnect: true,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
            // Join user's personal room for notifications
            this.socket?.emit('join', userId);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinLetterRoom(letterId: string) {
        if (this.socket?.connected) {
            this.socket.emit('join_letter', letterId);
        }
    }

    leaveLetterRoom(letterId: string) {
        if (this.socket?.connected) {
            this.socket.emit('leave_letter', letterId);
        }
    }

    onNewComment(callback: (comment: any) => void) {
        this.socket?.on('new_comment', callback);
    }

    onLikeUpdate(callback: (data: { letterId: string; likeCount: number; liked: boolean }) => void) {
        this.socket?.on('like_update', callback);
    }

    onNewNotification(callback: (notification: any) => void) {
        this.socket?.on('new_notification', callback);
    }

    onNewMessage(callback: (message: any) => void) {
        this.socket?.on('new_message', callback);
    }

    offNewMessage() {
        this.socket?.off('new_message');
    }

    offNewComment() {
        this.socket?.off('new_comment');
    }

    offLikeUpdate() {
        this.socket?.off('like_update');
    }

    offNewNotification() {
        this.socket?.off('new_notification');
    }

    getSocket() {
        return this.socket;
    }
}

export default new SocketService();
