import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../jwt';
import { UserRole } from '@/types';

let io: SocketIOServer | null = null;

export function initSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST'],
    },
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const payload = await verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    
    // Room strategy
    if (user) {
      socket.join('authenticated');
      socket.join(`user:${user.userId}`);
      if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
        socket.join('role:admin');
      }
      if (user.role === UserRole.CREW) {
        socket.join('role:crew');
      }
    }

    // Events server listens for
    socket.on('join:report', (reportId: string) => {
      socket.join(`report:${reportId}`);
    });

    socket.on('leave:report', (reportId: string) => {
      socket.leave(`report:${reportId}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io is not initialized');
  }
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) io.to(`user:${userId}`).emit(event, data);
}

export function emitToRole(role: string, event: string, data: any) {
  if (io) io.to(`role:${role}`).emit(event, data);
}

export function emitToReport(reportId: string, event: string, data: any) {
  if (io) io.to(`report:${reportId}`).emit(event, data);
}
