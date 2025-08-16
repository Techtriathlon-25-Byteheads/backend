import app from './app';
import http from 'http';
import { Server } from 'socket.io';
import { initializeSocketLogic } from './socketServer';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

initializeSocketLogic(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});