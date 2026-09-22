import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { seedDatabase } from './seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check endpoint for Railway deployment monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: "G's Booking System - CG Chillcation",
    version: '1.0',
    deployment: 'Railway'
  });
});

// Initialize database seed & start Express server
seedDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` G'S BOOKING SYSTEM - CG CHILLCATION API SERVER`);
    console.log(` Ready for Railway Deployment`);
    console.log(` Server running on http://localhost:${PORT}`);
    console.log(` API Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}).catch((err) => {
  console.error('Failed to initialize database seed:', err);
});
