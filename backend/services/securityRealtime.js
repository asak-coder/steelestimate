const { Server } = require('socket.io');
const { verifyAccessToken } = require('./jwtService');
const User = require('../models/User');
const { env } = require('../config/env');

let io = null;

const initSecurityRealtime = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true
    },
    path: '/socket.io'
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || String(socket.handshake.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!token) {
        throw new Error('Missing socket auth token');
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('role disabledAt');
      if (!user || user.disabledAt || user.role !== 'admin') {
        throw new Error('Socket admin access denied');
      }

      socket.user = {
        id: String(user._id),
        role: user.role
      };
      socket.join('admin-security');
      return next();
    } catch (error) {
      return next(error);
    }
  });

  return io;
};

const emitSecurityEvent = (event) => {
  if (!io) return;
  io.to('admin-security').emit('security:event', event);
};

module.exports = {
  initSecurityRealtime,
  emitSecurityEvent
};
