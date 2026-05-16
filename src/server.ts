// ─────────────────────────────────────────────────────────────────────────────
// src/server.ts
// Application entry point — boots the HTTP server and connects to MongoDB
// ─────────────────────────────────────────────────────────────────────────────

// ── DNS fix: override local resolver that blocks SRV/TXT queries ─────────────
// The system's local DNS (127.0.0.1) handles A records but refuses SRV lookups,
// which breaks mongoose's mongodb+srv:// connection string parsing.
// We redirect Node's resolver to Google Public DNS before any other code runs.
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import createApp from './app';
import connectDB from './config/db';

const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

/** Handle unhandled promise rejections (e.g. DB connection failures) */
process.on('unhandledRejection', (reason: unknown) => {
  console.error('💥 Unhandled Promise Rejection:', reason);
  process.exit(1);
});

/** Handle uncaught synchronous exceptions */
process.on('uncaughtException', (err: Error) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

const start = async (): Promise<void> => {
  // Connect to MongoDB first
  await connectDB();

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  🚀  GigFlow Lead API`);
    console.log(`  🌍  Environment : ${NODE_ENV}`);
    console.log(`  🔌  Port        : ${PORT}`);
    console.log(`  📡  URL         : http://localhost:${PORT}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  });

  // Graceful shutdown on SIGTERM (e.g. Docker / PM2 stop)
  process.on('SIGTERM', () => {
    console.log('🛑  SIGTERM received — shutting down gracefully...');
    server.close(() => {
      console.log('✅  HTTP server closed.');
      process.exit(0);
    });
  });
};

start();
