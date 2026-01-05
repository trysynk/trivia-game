const { Server } = require('socket.io');
const config = require('./env');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.corsOrigin.split(',').map(origin => origin.trim()),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initSocket, getIO };
