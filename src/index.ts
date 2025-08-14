import app from './app';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initializeSocketLogic } from './socketServer';

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // TODO: Restrict this to the citizen app's URL in production
    methods: ["GET", "POST"]
  }
});

initializeSocketLogic(io);

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});