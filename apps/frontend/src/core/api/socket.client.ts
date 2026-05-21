import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

let socket: Socket | null = null;

if (typeof window !== 'undefined') {
  socket = io(BACKEND_URL, {
    autoConnect: false,
  });
}

export { socket };
