import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/uploads', express.static('public/uploads'));
app.use('/v1', routes);

// Better-Auth handler
app.use("/api/auth", toNodeHandler(auth));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});
