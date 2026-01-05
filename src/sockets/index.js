const { sessionService } = require('../services');
const { setupEveryoneGameHandlers } = require('./everyoneGame');
const { setupBuzzerGameHandlers } = require('./buzzerGame');

const socketToSession = new Map();

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('create-session', async ({ gameType, settings }) => {
      try {
        const session = await sessionService.createSession(gameType, settings, socket.id);

        socket.join(session.sessionId);
        socketToSession.set(socket.id, session.sessionId);

        socket.emit('session-created', {
          sessionId: session.sessionId,
          qrUrl: `/qr-game/${gameType}/controller?session=${session.sessionId}`
        });

        console.log(`Session created: ${session.sessionId} by ${socket.id}`);
      } catch (error) {
        console.error('Error creating session:', error);
        socket.emit('error', { message: 'Failed to create session' });
      }
    });

    socket.on('join-session', async ({ sessionId, playerName, avatar }) => {
      try {
        const session = await sessionService.getSession(sessionId);

        if (!session) {
          return socket.emit('error', { message: 'Session not found' });
        }

        if (session.status !== 'waiting') {
          return socket.emit('error', { message: 'Game already started' });
        }

        await sessionService.addPlayer(sessionId, socket.id, playerName, avatar);

        socket.join(sessionId);
        socketToSession.set(socket.id, sessionId);

        const updatedSession = await sessionService.getSession(sessionId);
        const players = updatedSession.players.filter(p => p.isActive).map(p => ({
          socketId: p.socketId,
          name: p.name,
          avatar: p.avatar,
          score: p.score
        }));

        io.to(sessionId).emit('player-joined', { players });

        socket.emit('joined-session', {
          sessionId,
          gameType: session.gameType,
          settings: session.settings
        });

        console.log(`Player ${playerName} joined session ${sessionId}`);
      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { message: error.message || 'Failed to join session' });
      }
    });

    socket.on('host-rejoin', async ({ sessionId }) => {
      try {
        const session = await sessionService.getSession(sessionId);

        if (!session) {
          return socket.emit('error', { message: 'Session not found' });
        }

        session.hostSocketId = socket.id;
        await session.save();

        socket.join(sessionId);
        socketToSession.set(socket.id, sessionId);

        const players = session.players.filter(p => p.isActive).map(p => ({
          socketId: p.socketId,
          name: p.name,
          avatar: p.avatar,
          score: p.score
        }));

        socket.emit('host-rejoined', {
          session: {
            sessionId: session.sessionId,
            gameType: session.gameType,
            status: session.status,
            players,
            settings: session.settings,
            questionsAsked: session.questionsAsked.length
          }
        });

        console.log(`Host rejoined session ${sessionId}`);
      } catch (error) {
        console.error('Error host rejoin:', error);
        socket.emit('error', { message: 'Failed to rejoin session' });
      }
    });

    socket.on('leave-session', async ({ sessionId }) => {
      try {
        await sessionService.removePlayer(sessionId, socket.id);

        socket.leave(sessionId);
        socketToSession.delete(socket.id);

        const session = await sessionService.getSession(sessionId);
        if (session) {
          const players = session.players.filter(p => p.isActive).map(p => ({
            socketId: p.socketId,
            name: p.name,
            avatar: p.avatar,
            score: p.score
          }));

          io.to(sessionId).emit('player-left', { players });
        }

        console.log(`Player ${socket.id} left session ${sessionId}`);
      } catch (error) {
        console.error('Error leaving session:', error);
      }
    });

    socket.on('kick-player', async ({ sessionId, playerId }) => {
      try {
        const session = await sessionService.getSession(sessionId);

        if (!session) return;
        if (session.hostSocketId !== socket.id) return;

        await sessionService.removePlayer(sessionId, playerId);

        io.to(playerId).emit('kicked');

        const playerSocket = io.sockets.sockets.get(playerId);
        if (playerSocket) {
          playerSocket.leave(sessionId);
        }

        const updatedSession = await sessionService.getSession(sessionId);
        const players = updatedSession.players.filter(p => p.isActive).map(p => ({
          socketId: p.socketId,
          name: p.name,
          avatar: p.avatar,
          score: p.score
        }));

        io.to(sessionId).emit('player-left', { players });

        console.log(`Player ${playerId} kicked from session ${sessionId}`);
      } catch (error) {
        console.error('Error kicking player:', error);
      }
    });

    socket.on('update-settings', async ({ sessionId, settings }) => {
      try {
        const session = await sessionService.getSession(sessionId);

        if (!session) return;
        if (session.hostSocketId !== socket.id) return;
        if (session.status !== 'waiting') return;

        session.settings = { ...session.settings, ...settings };
        await session.save();

        io.to(sessionId).emit('settings-updated', { settings: session.settings });

        console.log(`Settings updated for session ${sessionId}`);
      } catch (error) {
        console.error('Error updating settings:', error);
      }
    });

    socket.on('get-leaderboard', async ({ sessionId }) => {
      try {
        const leaderboard = await sessionService.getLeaderboard(sessionId);
        socket.emit('leaderboard', { leaderboard });
      } catch (error) {
        console.error('Error getting leaderboard:', error);
      }
    });

    setupEveryoneGameHandlers(io, socket);
    setupBuzzerGameHandlers(io, socket);

    socket.on('disconnect', async () => {
      try {
        const sessionId = socketToSession.get(socket.id);

        if (sessionId) {
          const session = await sessionService.getSession(sessionId);

          if (session) {
            if (session.hostSocketId === socket.id) {
              console.log(`Host disconnected from session ${sessionId}`);
            } else {
              await sessionService.removePlayer(sessionId, socket.id);

              const updatedSession = await sessionService.getSession(sessionId);
              if (updatedSession) {
                const players = updatedSession.players.filter(p => p.isActive).map(p => ({
                  socketId: p.socketId,
                  name: p.name,
                  avatar: p.avatar,
                  score: p.score
                }));

                io.to(sessionId).emit('player-left', { players });
              }
            }
          }

          socketToSession.delete(socket.id);
        }

        console.log(`Client disconnected: ${socket.id}`);
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });
};

module.exports = { setupSocketHandlers };
