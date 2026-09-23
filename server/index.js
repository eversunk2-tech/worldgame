// server/index.js — Express static server for the built client (dist/) + /health.
// ESM so that src/shared can later be imported (via tsx or build output) for
// server-authoritative simulation.
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT) || 3100;

const app = express();

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Serve the Vite build output. No wildcard routes (Express 4/5 syntax differences).
app.use(express.static(DIST_DIR));

const httpServer = http.createServer(app);

/**
 * Realtime (multiplayer) attachment point. Intentionally empty in v0.1.
 * @param {import('node:http').Server} _server
 */
export function attachRealtime(_server) {
  // TODO(multiplayer): socket.io 서버 부착, 'cmd' 수신 → stepSimulation → 'state' 브로드캐스트
  // import { Server } from 'socket.io';
  // const io = new Server(_server);
  // io.on('connection', (socket) => { socket.on('cmd', (cmd) => { ... }); });
}

attachRealtime(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[play1] serving ${DIST_DIR} at http://localhost:${PORT}`);
});
